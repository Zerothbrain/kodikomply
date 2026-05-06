import prisma from '../lib/prisma';

// ── VAT BAD DEBT ADJUSTMENT (S.78 VAT Act) ────────────────────────────────────
export interface BadDebtInput {
  side: 'supplier' | 'customer';
  invoiceAmountInclVAT: number;
  invoiceDate: string;
  dueDate: string;
  writtenOff?: boolean;
  laterPaymentDate?: string;
}

export interface BadDebtResult {
  adjustmentAmount: number;
  direction: 'INCREASING' | 'DECREASING' | 'NONE';
  eligible: boolean;
  monthsOverdue: number;
  taxFraction: number;
  explanation: string;
  returnPeriodNote: string;
  legalRef: string;
}

export async function calculateVatBadDebt(input: BadDebtInput): Promise<BadDebtResult> {
  const thresholdRule = await prisma.taxRule.findFirst({ where: { category: 'VAT_SPECIAL', name: { contains: 'Bad debt overdue' }, isActive: true } });
  const thresholdMonths = Number(thresholdRule?.fixedAmount ?? 18);
  const taxFractionRule = await prisma.taxRule.findFirst({ where: { category: 'VAT_SPECIAL', name: { contains: 'tax fraction' }, isActive: true } });
  const taxFraction = Number(taxFractionRule?.rate ?? 18 / 118);

  const due = new Date(input.dueDate);
  const now = new Date();
  const monthsOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const unpaidVAT = Math.round(input.invoiceAmountInclVAT * taxFraction);
  const isOverThreshold = monthsOverdue >= thresholdMonths;

  if (input.laterPaymentDate) {
    const direction = input.side === 'supplier' ? 'INCREASING' : 'DECREASING';
    return {
      adjustmentAmount: unpaidVAT,
      direction,
      eligible: true,
      monthsOverdue,
      taxFraction,
      explanation: `Payment received after adjustment was made. ${input.side === 'supplier' ? 'Supplier must make INCREASING adjustment to reverse the bad debt claim.' : 'Customer may make DECREASING adjustment to recover input tax.'} Amount: TZS ${unpaidVAT.toLocaleString()}`,
      returnPeriodNote: 'Include in the tax period in which payment was received.',
      legalRef: 'S.78 VAT Act Cap 148 R.E.2023',
    };
  }

  if (input.side === 'supplier') {
    if (!isOverThreshold) {
      return { adjustmentAmount: 0, direction: 'NONE', eligible: false, monthsOverdue, taxFraction, explanation: `Not yet eligible. Debt must be overdue for at least ${thresholdMonths} months (currently ${monthsOverdue} months). You may make the adjustment once the ${thresholdMonths}-month threshold is reached AND the debt is written off in your books.`, returnPeriodNote: '', legalRef: 'S.78 VAT Act Cap 148 R.E.2023' };
    }
    if (!input.writtenOff) {
      return { adjustmentAmount: 0, direction: 'NONE', eligible: false, monthsOverdue, taxFraction, explanation: `Threshold of ${thresholdMonths} months has been exceeded, but you must also write off the debt in your books before making the decreasing adjustment.`, returnPeriodNote: '', legalRef: 'S.78 VAT Act Cap 148 R.E.2023' };
    }
    return {
      adjustmentAmount: unpaidVAT,
      direction: 'DECREASING',
      eligible: true,
      monthsOverdue,
      taxFraction,
      explanation: `Supplier is entitled to a DECREASING ADJUSTMENT. The debt has been overdue for ${monthsOverdue} months (≥${thresholdMonths} months) and has been written off. Adjustment = tax fraction (18/118) × TZS ${input.invoiceAmountInclVAT.toLocaleString()} = TZS ${unpaidVAT.toLocaleString()}. Note: if the customer later pays, you must reverse this with an INCREASING ADJUSTMENT.`,
      returnPeriodNote: 'Make the adjustment in the tax period when the debt was written off OR when 18 months was reached, whichever is later.',
      legalRef: 'S.78 VAT Act Cap 148 R.E.2023',
    };
  } else {
    // customer side
    if (!isOverThreshold) {
      return { adjustmentAmount: 0, direction: 'NONE', eligible: false, monthsOverdue, taxFraction, explanation: `No action required yet. The ${thresholdMonths}-month threshold has not been reached (${monthsOverdue} months overdue). You must make an increasing adjustment once ${thresholdMonths} months have passed without payment.`, returnPeriodNote: '', legalRef: 'S.78 VAT Act Cap 148 R.E.2023' };
    }
    return {
      adjustmentAmount: unpaidVAT,
      direction: 'INCREASING',
      eligible: true,
      monthsOverdue,
      taxFraction,
      explanation: `Customer MUST make an INCREASING ADJUSTMENT. You have claimed input tax credit but have not paid the supplier for ${monthsOverdue} months (≥${thresholdMonths} months). You must repay TZS ${unpaidVAT.toLocaleString()} to the Commissioner. If you later pay the supplier, you may make a DECREASING ADJUSTMENT to recover this.`,
      returnPeriodNote: `Make the adjustment in the tax period when the debt first became overdue by ${thresholdMonths} months.`,
      legalRef: 'S.78 VAT Act Cap 148 R.E.2023',
    };
  }
}

// ── VAT REFUND ELIGIBILITY (S.85-88 VAT Act) ─────────────────────────────────
export interface VatRefundInput {
  zeroRatedTurnoverPercent: number;
  zeroRatedInputTaxPercent: number;
  negativeNetAmount: number;
  consecutiveNegativePeriods: number;
}

export interface VatRefundResult {
  eligibleForImmediateRefund: boolean;
  reason: string;
  refundAmount: number;
  applicationDeadlineNote: string;
  processNote: string;
  legalRef: string;
}

export async function calculateVatRefund(input: VatRefundInput): Promise<VatRefundResult> {
  const thresholdRule = await prisma.taxRule.findFirst({ where: { category: 'VAT_SPECIAL', name: { contains: 'Zero-rated refund threshold' }, isActive: true } });
  const threshold = Number(thresholdRule?.rate ?? 0.5) * 100;
  const carryFwdRule = await prisma.taxRule.findFirst({ where: { category: 'VAT_SPECIAL', name: { contains: 'carry forward periods' }, isActive: true } });
  const maxPeriods = Number(carryFwdRule?.fixedAmount ?? 6);
  const deadlineRule = await prisma.taxRule.findFirst({ where: { category: 'VAT_SPECIAL', name: { contains: 'refund application deadline' }, isActive: true } });
  const deadlineYears = Number(deadlineRule?.fixedAmount ?? 3);

  const meetsZeroRatedTurnover = input.zeroRatedTurnoverPercent >= threshold;
  const meetsZeroRatedInput = input.zeroRatedInputTaxPercent >= threshold;
  const meetsCarryForward = input.consecutiveNegativePeriods >= maxPeriods;

  if (meetsZeroRatedTurnover || meetsZeroRatedInput) {
    const reason = meetsZeroRatedTurnover
      ? `${input.zeroRatedTurnoverPercent}% of turnover is zero-rated (≥${threshold}% threshold met — S.86 VAT Act)`
      : `${input.zeroRatedInputTaxPercent}% of input tax relates to zero-rated supplies (≥${threshold}% threshold met — S.86 VAT Act)`;
    return {
      eligibleForImmediateRefund: true,
      reason,
      refundAmount: input.negativeNetAmount,
      applicationDeadlineNote: `Apply within ${deadlineYears} years from the end of the tax period.`,
      processNote: 'You are entitled to an IMMEDIATE REFUND without needing to carry forward first. Apply to the Commissioner with your VAT return. Commissioner must decide within 90 days. Refund is offset against any outstanding tax liabilities first.',
      legalRef: 'S.86 VAT Act Cap 148 R.E.2023',
    };
  }

  if (meetsCarryForward) {
    return {
      eligibleForImmediateRefund: true,
      reason: `Negative net amount has persisted for ${input.consecutiveNegativePeriods} consecutive periods (≥${maxPeriods} periods without reduction — S.85 VAT Act).`,
      refundAmount: input.negativeNetAmount,
      applicationDeadlineNote: `Apply within ${deadlineYears} years from the end of the tax period.`,
      processNote: `You may now apply for a refund after ${maxPeriods} consecutive periods of negative net amounts. Ensure all VAT returns are filed before applying. Commissioner must decide within 90 days.`,
      legalRef: 'S.85-86 VAT Act Cap 148 R.E.2023',
    };
  }

  return {
    eligibleForImmediateRefund: false,
    reason: `You do not yet meet the threshold for immediate refund. Zero-rated turnover: ${input.zeroRatedTurnoverPercent}% (need ≥${threshold}%). Zero-rated input tax: ${input.zeroRatedInputTaxPercent}% (need ≥${threshold}%). Consecutive negative periods: ${input.consecutiveNegativePeriods} (need ≥${maxPeriods}).`,
    refundAmount: 0,
    applicationDeadlineNote: '',
    processNote: `Your negative net amount of TZS ${input.negativeNetAmount.toLocaleString()} is carried forward to the next tax period. It will be applied against positive amounts in future periods (oldest first). You can apply for a refund after ${maxPeriods} consecutive periods without reduction, or if your zero-rated supplies reach ${threshold}%.`,
    legalRef: 'S.85 VAT Act Cap 148 R.E.2023',
  };
}

// ── VAT GOING CONCERN (S.20 VAT Act) ──────────────────────────────────────────
export interface GoingConcernInput {
  sellingEntireBusiness: boolean;
  buyerContinuingActivity: boolean;
  transferringEverythingNecessary: boolean;
  canOperateSeparately?: boolean;
}

export interface GoingConcernResult {
  qualifies: boolean;
  vatAmount: number;
  explanation: string;
  inputTaxNote: string;
  apportionmentNote: string;
  legalRef: string;
}

export function calculateGoingConcern(input: GoingConcernInput): GoingConcernResult {
  const allMet = input.buyerContinuingActivity && input.transferringEverythingNecessary;
  const partQualifies = !input.sellingEntireBusiness && (input.canOperateSeparately ?? false) && allMet;
  const qualifies = (input.sellingEntireBusiness && allMet) || partQualifies;

  if (qualifies) {
    return {
      qualifies: true,
      vatAmount: 0,
      explanation: `This sale qualifies as a GOING CONCERN under S.20 VAT Act. It is treated as NOT a taxable supply — VAT = NIL. ${!input.sellingEntireBusiness ? 'Part of a business qualifies if it can be operated separately as a going concern.' : ''}`,
      inputTaxNote: 'Input tax on costs incurred in making this sale is treated as relating to taxable supplies — full input tax credit is available.',
      apportionmentNote: 'The going concern value is NOT included in the taxable/total supply apportionment calculation.',
      legalRef: 'S.20 VAT Act Cap 148 R.E.2023',
    };
  }

  const reasons: string[] = [];
  if (!input.buyerContinuingActivity) reasons.push('buyer is not acquiring it to continue the same economic activity');
  if (!input.transferringEverythingNecessary) reasons.push('not everything necessary for the business to continue is being transferred');
  if (!input.sellingEntireBusiness && !(input.canOperateSeparately ?? false)) reasons.push('the part being sold cannot be operated independently as a separate business');

  return {
    qualifies: false,
    vatAmount: 0,
    explanation: `This sale does NOT qualify as a going concern because: ${reasons.join('; ')}. Normal VAT rules apply — VAT at 18% on the market value of the supply.`,
    inputTaxNote: 'Normal input tax apportionment rules apply.',
    apportionmentNote: 'Normal apportionment rules apply.',
    legalRef: 'S.20 VAT Act Cap 148 R.E.2023',
  };
}

// ── VAT ADJUSTMENT EVENTS (S.75-77 VAT Act) ───────────────────────────────────
export interface VatAdjustmentInput {
  side: 'supplier' | 'customer';
  eventType: 'CANCELLATION' | 'PRICE_CHANGE' | 'GOODS_RETURNED' | 'SUPPLY_TYPE_CHANGED';
  originalVAT: number;
  revisedVAT: number;
}

export interface VatAdjustmentResult {
  adjustmentAmount: number;
  direction: 'INCREASING' | 'DECREASING';
  adjustmentNoteRequired: boolean;
  deadlineNote: string;
  explanation: string;
  legalRef: string;
}

export function calculateVatAdjustment(input: VatAdjustmentInput): VatAdjustmentResult {
  const diff = input.revisedVAT - input.originalVAT;
  const absAmount = Math.abs(diff);
  const supplierIncreasing = diff > 0;

  let direction: 'INCREASING' | 'DECREASING';
  let adjustmentNoteRequired = false;

  if (input.side === 'supplier') {
    direction = supplierIncreasing ? 'INCREASING' : 'DECREASING';
    adjustmentNoteRequired = !supplierIncreasing; // supplier must issue note when decreasing
  } else {
    // customer is mirror of supplier
    direction = supplierIncreasing ? 'INCREASING' : 'DECREASING';
    adjustmentNoteRequired = false;
  }

  const eventLabels: Record<string, string> = {
    CANCELLATION: 'Cancellation of supply',
    PRICE_CHANGE: 'Change in consideration',
    GOODS_RETURNED: 'Return of goods to supplier',
    SUPPLY_TYPE_CHANGED: 'Supply became/ceased to be taxable',
  };

  return {
    adjustmentAmount: absAmount,
    direction,
    adjustmentNoteRequired,
    deadlineNote: adjustmentNoteRequired
      ? 'Supplier must issue an adjustment note to the customer within 7 days of becoming aware of the event.'
      : input.side === 'customer'
        ? 'Customer has 6 tax periods to make this adjustment after receiving supplier\'s adjustment note.'
        : 'Make adjustment in the tax period when you became aware of the event.',
    explanation: `${eventLabels[input.eventType]} — ${input.side === 'supplier' ? 'Supplier' : 'Customer'} must make a ${direction} ADJUSTMENT of TZS ${absAmount.toLocaleString()}. Original VAT: TZS ${input.originalVAT.toLocaleString()}. Revised VAT: TZS ${input.revisedVAT.toLocaleString()}.`,
    legalRef: 'S.75-77 VAT Act Cap 148 R.E.2023',
  };
}

// ── VAT CONNECTED PERSONS (S.18 VAT Act) ─────────────────────────────────────
export interface ConnectedPersonsInput {
  isConnectedPerson: boolean;
  actualConsideration: number;
  fairMarketValue: number;
}

export interface ConnectedPersonsResult {
  vatBase: number;
  vatAmount: number;
  adjustment: number;
  explanation: string;
  legalRef: string;
}

export function calculateConnectedPersonsVAT(input: ConnectedPersonsInput): ConnectedPersonsResult {
  const vatRate = 0.18;
  if (!input.isConnectedPerson || input.actualConsideration >= input.fairMarketValue) {
    const vatBase = input.actualConsideration;
    return {
      vatBase,
      vatAmount: Math.round(vatBase * vatRate),
      adjustment: 0,
      explanation: 'No adjustment required. VAT is calculated on the actual consideration.',
      legalRef: 'S.18 VAT Act Cap 148 R.E.2023',
    };
  }
  const vatBase = Math.round(input.fairMarketValue * 100 / 118);
  const vatAmount = Math.round(vatBase * vatRate);
  const normalVAT = Math.round(input.actualConsideration * vatRate);
  return {
    vatBase,
    vatAmount,
    adjustment: vatAmount - normalVAT,
    explanation: `Supply to a connected person at below market value. VAT must be calculated on the FAIR MARKET VALUE of TZS ${input.fairMarketValue.toLocaleString()} (S.18 VAT Act). VAT-exclusive base = TZS ${vatBase.toLocaleString()} (fair market value × 100/118). VAT = TZS ${vatAmount.toLocaleString()}. Additional VAT vs actual consideration: TZS ${(vatAmount - normalVAT).toLocaleString()}.`,
    legalRef: 'S.18 VAT Act Cap 148 R.E.2023',
  };
}

// ── LAY-BY SALES VAT (S.16 VAT Act) ──────────────────────────────────────────
export interface LayByPayment { amount: number; date: string; }
export interface LayByInput {
  totalPriceInclVAT: number;
  payments: LayByPayment[];
}

export interface LayByResult {
  payments: Array<{ amount: number; date: string; vatDue: number; taxPeriod: string }>;
  totalVAT: number;
  taxFraction: number;
  explanation: string;
  legalRef: string;
}

export function calculateLayBy(input: LayByInput): LayByResult {
  const taxFraction = 18 / 118;
  const payments = input.payments.map(p => {
    const d = new Date(p.date);
    const taxPeriod = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    return { amount: p.amount, date: p.date, vatDue: Math.round(p.amount * taxFraction), taxPeriod };
  });
  const totalVAT = payments.reduce((s, p) => s + p.vatDue, 0);
  return {
    payments,
    totalVAT,
    taxFraction,
    explanation: `Lay-by sale: VAT is payable at EACH instalment payment (not when goods are delivered). Tax fraction 18/118 applied to each payment. Total VAT across all instalments: TZS ${totalVAT.toLocaleString()}.`,
    legalRef: 'S.16 VAT Act Cap 148 R.E.2023',
  };
}

// ── VAT PRICING TOOL (S.38 VAT Act) ──────────────────────────────────────────
export function calculateVatPricing(amount: number, isInclusive: boolean): { exclusive: number; vat: number; inclusive: number } {
  if (isInclusive) {
    const vat = Math.round(amount * 18 / 118);
    return { exclusive: amount - vat, vat, inclusive: amount };
  } else {
    const vat = Math.round(amount * 0.18);
    return { exclusive: amount, vat, inclusive: amount + vat };
  }
}

// ── FILING REQUIRED CHECKER (S.118 ITA) ──────────────────────────────────────
export interface FilingRequiredInput {
  isResident: boolean;
  hasTaxPayable: boolean;
  incomeTypes: string[];
}

export interface FilingRequiredResult {
  mustFile: boolean;
  reason: string;
  deadline: string;
  whatToAttach: string[];
  legalRef: string;
}

export function checkFilingRequired(input: FilingRequiredInput): FilingRequiredResult {
  const onlyPAYEAndCapGains = input.incomeTypes.every(t => ['employment_paye', 'capital_gains_instalment'].includes(t));

  if (!input.hasTaxPayable && input.isResident) {
    return { mustFile: false, reason: 'Case A (S.118 ITA): Resident individual with zero income tax payable for the year — no return required unless Commissioner requests.', deadline: '', whatToAttach: [], legalRef: 'S.118 ITA Cap 332 R.E.2023' };
  }
  if (input.isResident && onlyPAYEAndCapGains && input.incomeTypes.length > 0) {
    return { mustFile: false, reason: 'Case B (S.118 ITA): Resident individual whose only income is employment income subject to PAYE withholding and/or single-instalment capital gains — no return required unless Commissioner requests.', deadline: '', whatToAttach: [], legalRef: 'S.118 ITA Cap 332 R.E.2023' };
  }
  if (!input.isResident) {
    const onlyFinalWHT = input.incomeTypes.every(t => ['final_wht', 'digital_services_wht'].includes(t));
    if (!input.hasTaxPayable || onlyFinalWHT) {
      return { mustFile: false, reason: 'Case C (S.118 ITA): Non-resident with no income tax payable OR whose income consists exclusively of final withholding payments — no return required.', deadline: '', whatToAttach: [], legalRef: 'S.118 ITA Cap 332 R.E.2023' };
    }
  }

  return {
    mustFile: true,
    reason: 'You are required to file an annual income tax return under S.117 ITA.',
    deadline: '30 June of the following year (6 months after the end of the year of income for calendar-year taxpayers).',
    whatToAttach: [
      'WHT certificates from employers/payers',
      'Financial statements (certified if applicable)',
      'Entities: return signed by MANAGER and a CERTIFIED PUBLIC ACCOUNTANT',
      'Individuals: return signed by the individual taxpayer',
      'Any other information prescribed by the Commissioner',
    ],
    legalRef: 'S.117-118 ITA Cap 332 R.E.2023',
  };
}

// ── CHARITABLE ORGANISATION (S.64 ITA) ────────────────────────────────────────
export interface CharitableOrgInput {
  hasTRAruling: boolean;
  totalIncome: number;
  giftsAndDonations: number;
  amountsAppliedInCharitableFunctions: number;
  charitableBusinessIncome: number;
}

export interface CharitableOrgResult {
  reserveDeduction: number;
  allowableDeduction: number;
  netCharitableIncome: number;
  nonCharitableTaxable: number;
  taxPayable: number;
  explanation: string;
  legalRef: string;
}

export function calculateCharitableOrg(input: CharitableOrgInput): CharitableOrgResult {
  if (!input.hasTRAruling) {
    return { reserveDeduction: 0, allowableDeduction: 0, netCharitableIncome: input.totalIncome, nonCharitableTaxable: input.totalIncome, taxPayable: Math.round(input.totalIncome * 0.3), explanation: 'Organisation does not have a TRA charitable ruling. Treated as normal business — 30% corporate tax applies on total income.', legalRef: 'S.64 ITA Cap 332 R.E.2023' };
  }
  const reserveDeduction = Math.round(input.charitableBusinessIncome * 0.25);
  const allowableDeduction = input.amountsAppliedInCharitableFunctions;
  const net = input.charitableBusinessIncome - allowableDeduction - reserveDeduction;
  const nonCharitableTaxable = net > 0 ? 0 : Math.abs(net);
  return {
    reserveDeduction,
    allowableDeduction,
    netCharitableIncome: Math.max(0, net),
    nonCharitableTaxable,
    taxPayable: Math.round(nonCharitableTaxable * 0.3),
    explanation: `S.64 ITA charitable organisation. Reserve deduction (25% of charitable business income): TZS ${reserveDeduction.toLocaleString()}. Amounts applied in charitable functions: TZS ${allowableDeduction.toLocaleString()}. Net: TZS ${net.toLocaleString()}. ${nonCharitableTaxable > 0 ? `Non-charitable taxable amount: TZS ${nonCharitableTaxable.toLocaleString()} — taxed at 30%.` : 'No taxable amount — fully covered by deductions.'}`,
    legalRef: 'S.64 ITA Cap 332 R.E.2023',
  };
}

// ── CLUBS AND TRADE ASSOCIATIONS (S.65 ITA) ────────────────────────────────────
export interface ClubsInput {
  entityType: 'CLUB' | 'TRADE_ASSOCIATION';
  totalIncome: number;
  memberIncome: number;
}

export interface ClubsResult {
  memberPercent: number;
  isExempt: boolean;
  taxableIncome: number;
  taxPayable: number;
  explanation: string;
  legalRef: string;
}

export function calculateClubsAssociations(input: ClubsInput): ClubsResult {
  const memberPercent = input.totalIncome > 0 ? (input.memberIncome / input.totalIncome) * 100 : 0;
  const isExempt = memberPercent >= 75;
  const taxableIncome = isExempt ? 0 : input.totalIncome;
  return {
    memberPercent,
    isExempt,
    taxableIncome,
    taxPayable: isExempt ? 0 : Math.round(taxableIncome * 0.3),
    explanation: `${input.entityType === 'CLUB' ? 'Members\' club' : 'Trade association'} — ${memberPercent.toFixed(1)}% of income from members. ${isExempt ? 'EXEMPT: ≥75% of income comes from members — entire income is exempt from income tax (S.65 ITA).' : 'TAXABLE: Less than 75% of income from members — full income taxed as business income at 30%.'}`,
    legalRef: 'S.65 ITA Cap 332 R.E.2023',
  };
}

// ── DIGITAL MARKETPLACE TAX (S.116 ITA) ───────────────────────────────────────
export interface DigitalMarketplaceInput {
  grossPaymentFromTanzania: number;
  month: number;
  year: number;
}

export interface DigitalMarketplaceResult {
  taxRate: number;
  taxDue: number;
  filingDeadline: string;
  explanation: string;
  legalRef: string;
}

export async function calculateDigitalMarketplace(input: DigitalMarketplaceInput): Promise<DigitalMarketplaceResult> {
  const rateRule = await prisma.taxRule.findFirst({ where: { category: 'VAT_SPECIAL', name: { contains: 'Digital marketplace tax rate' }, isActive: true } });
  const rate = Number(rateRule?.rate ?? 0.02);
  const dayRule = await prisma.taxRule.findFirst({ where: { category: 'VAT_SPECIAL', name: { contains: 'Digital marketplace filing day' }, isActive: true } });
  const filingDay = Number(dayRule?.fixedAmount ?? 20);

  const nextMonth = input.month === 12 ? 1 : input.month + 1;
  const nextYear = input.month === 12 ? input.year + 1 : input.year;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const filingDeadline = `${filingDay} ${monthNames[nextMonth - 1]} ${nextYear}`;
  const taxDue = Math.round(input.grossPaymentFromTanzania * rate);

  return {
    taxRate: rate,
    taxDue,
    filingDeadline,
    explanation: `Digital marketplace tax (S.116 ITA): ${(rate * 100).toFixed(0)}% × TZS ${input.grossPaymentFromTanzania.toLocaleString()} gross payment = TZS ${taxDue.toLocaleString()}. Self-assessed — no withholding agent. File by ${filingDeadline}.`,
    legalRef: 'S.116 ITA Cap 332 R.E.2023',
  };
}

// ── THIN CAPITALISATION FULL CALC (S.12 ITA) ──────────────────────────────────
export interface ThinCapInput {
  isExemptControlled: boolean;
  monthlyDebtBalances: number[];
  paidUpShareCapital: number;
  totalInterestExpense: number;
}

export interface ThinCapResult {
  averageDebt: number;
  maximumAllowedDebt: number;
  isOverLimit: boolean;
  allowedInterest: number;
  disallowedInterest: number;
  debtToEquityRatio: number;
  explanation: string;
  legalRef: string;
}

export function calculateThinCap(input: ThinCapInput): ThinCapResult {
  if (!input.isExemptControlled) {
    return { averageDebt: 0, maximumAllowedDebt: 0, isOverLimit: false, allowedInterest: input.totalInterestExpense, disallowedInterest: 0, debtToEquityRatio: 0, explanation: 'Thin capitalisation rules (S.12 ITA) do not apply — company is not an exempt-controlled resident entity (requires 25%+ ownership by exempt bodies, retirement funds, charities, or non-residents).', legalRef: 'S.12 ITA Cap 332 R.E.2023' };
  }
  const avgDebt = Math.round(input.monthlyDebtBalances.reduce((s, b) => s + b, 0) / 12);
  const maxAllowed = Math.round(input.paidUpShareCapital * 7 / 3);
  const isOver = avgDebt > maxAllowed;
  const allowedInterest = isOver ? Math.round((maxAllowed / avgDebt) * input.totalInterestExpense) : input.totalInterestExpense;
  const disallowed = input.totalInterestExpense - allowedInterest;
  return {
    averageDebt: avgDebt,
    maximumAllowedDebt: maxAllowed,
    isOverLimit: isOver,
    allowedInterest,
    disallowedInterest: disallowed,
    debtToEquityRatio: input.paidUpShareCapital > 0 ? avgDebt / input.paidUpShareCapital : 0,
    explanation: `Average debt: TZS ${avgDebt.toLocaleString()}. Equity (paid-up capital): TZS ${input.paidUpShareCapital.toLocaleString()}. Maximum allowed debt (7/3 × equity): TZS ${maxAllowed.toLocaleString()}. ${isOver ? `Debt EXCEEDS maximum by TZS ${(avgDebt - maxAllowed).toLocaleString()}. Allowed interest = (${maxAllowed.toLocaleString()} ÷ ${avgDebt.toLocaleString()}) × TZS ${input.totalInterestExpense.toLocaleString()} = TZS ${allowedInterest.toLocaleString()}. Disallowed (added back to income): TZS ${disallowed.toLocaleString()}.` : 'Debt is within the 7:3 limit — all interest is deductible.'}`,
    legalRef: 'S.12 ITA Cap 332 R.E.2023',
  };
}
