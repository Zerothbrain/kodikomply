import prisma from '../lib/prisma';

export interface DepreciableAsset {
  class: 1 | 2 | 3 | 5 | 6 | 7 | 8 | 'agriculture';
  openingBalance: number;
  additions: number;
  disposalProceeds: number;
  daysOwned?: number;
  usefulLifeYears?: number;
  isManufacturingFixedAsset?: boolean;
  isFirstYear?: boolean;
}

export interface LossCarryforwardEntry {
  yearOfIncome: number;
  remainingLoss: number;
}

export interface BusinessInput {
  businessType: 'sole_proprietor' | 'partnership' | 'limited_company' | 'ngo';
  annualTurnover: number;
  isAgriculture: boolean;
  serviceRevenue?: number;
  tradingStockSales?: number;
  openingStock?: number;
  purchases?: number;
  closingStock?: number;
  expenses: {
    rent?: number;
    salaries?: number;
    utilities?: number;
    interest?: number;
    repairs?: number;
    rdExpenditure?: number;
    environmentalExpenditure?: number;
    agriculturalImprovement?: number;
    retirementContributions?: number;
    otherAllowable?: number;
  };
  donations?: { teaDonations?: number; otherDonations?: number };
  badDebts?: number;
  isAccrualBasis?: boolean;
  depreciableAssets?: DepreciableAsset[];
  equityAmount?: number;
  debtAmount?: number;
  isExemptControlled?: boolean;
  // Transfer pricing / income splitting flags
  hasRelatedPartyTransactions?: boolean;
  hasManagementFeesToParent?: boolean;
  hasParentCompanyLoans?: boolean;
  hasIncomeTransferToFamily?: boolean;
  // Loss carryforward
  priorLosses?: LossCarryforwardEntry[];
}

export interface BusinessResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxPayable: number;
  breakdown: Array<{ description: string; amount: number; notes: string }>;
  explanation: string;
  isSubsistenceFarmerExempt?: boolean;
  transferPricingWarnings: string[];
  incomeSplittingWarning?: string;
  lossCarryforwardUsed: number;
  priorLossesUtilised: LossCarryforwardEntry[];
}

interface DepreciationResult {
  class: string;
  rate: number;
  openingBasis: number;
  closingBasis: number;
  allowance: number;
  disposalIncome: number;
  writtenOff: boolean;
}

async function getDepreciationRates(): Promise<Record<string, number>> {
  const rules = await prisma.taxRule.findMany({
    where: { category: 'DEPRECIATION', isActive: true },
  });
  const rates: Record<string, number> = {
    '1': 0.375, '2': 0.25, '3': 0.125, '5': 0.20, '6': 0.05, '8': 1.0,
  };
  for (const r of rules) {
    if (r.name && r.rate) rates[r.name] = Number(r.rate);
  }
  return rates;
}

async function getWriteOffThreshold(): Promise<number> {
  const rule = await prisma.taxRule.findFirst({ where: { category: 'DEPRECIATION_WRITEOFF', isActive: true } });
  return Number(rule?.fixedAmount ?? 1_000_000);
}

function calculateDepreciation(asset: DepreciableAsset, rates: Record<string, number>, writeOffThreshold: number): DepreciationResult {
  const key = String(asset.class);
  const rate = key === '7'
    ? (asset.usefulLifeYears ? 1 / Math.round(asset.usefulLifeYears * 2) * 2 : 0.10)
    : (rates[key] ?? 0.125);

  const isStraightLine = ['5', '6', '7'].includes(key);
  const openingBasis = asset.openingBalance + asset.additions;
  const afterDisposal = openingBasis - asset.disposalProceeds;
  let disposalIncome = 0;
  let basis = afterDisposal;
  if (basis < 0) {
    disposalIncome = Math.abs(basis);
    basis = 0;
  }

  // Initial allowance for Class 2 & 3 in manufacturing/fish farming/hotel
  let initialAllowance = 0;
  if ((key === '2' || key === '3') && asset.isManufacturingFixedAsset) {
    if (asset.isFirstYear) {
      // Year 1: 50% of additions as initial allowance
      initialAllowance = Math.round(asset.additions * 0.50);
    } else {
      // Year 2: remaining 50%
      initialAllowance = Math.round(asset.additions * 0.50);
    }
  }

  // Days pro-ration: A × B × C/365
  const daysRatio = asset.daysOwned ? asset.daysOwned / 365 : 1;

  let allowance: number;
  if (isStraightLine) {
    allowance = Math.round(basis * rate * daysRatio) + initialAllowance;
  } else {
    allowance = Math.round(basis * rate * daysRatio) + initialAllowance;
  }

  const afterDepreciation = Math.max(0, basis - allowance);
  let writtenOff = false;

  // Pool write-off: if remaining basis after depreciation < threshold, write off all
  if (!isStraightLine && afterDepreciation > 0 && afterDepreciation < writeOffThreshold) {
    allowance = basis;
    writtenOff = true;
  }

  const closingBasis = Math.max(0, basis - allowance);

  return { class: key, rate, openingBasis, closingBasis, allowance, disposalIncome, writtenOff };
}

export async function calculateBusiness(input: BusinessInput): Promise<BusinessResult> {
  const breakdown: Array<{ description: string; amount: number; notes: string }> = [];
  const transferPricingWarnings: string[] = [];

  // Subsistence farming exemption
  if (input.isAgriculture && input.annualTurnover < 3_000_000 && input.businessType === 'sole_proprietor') {
    return {
      grossIncome: input.annualTurnover,
      totalDeductions: 0,
      taxableIncome: 0,
      taxPayable: 0,
      breakdown: [],
      explanation: 'Subsistence farmer exemption applies: individual farming with turnover below TZS 3,000,000.',
      isSubsistenceFarmerExempt: true,
      transferPricingWarnings: [],
      lossCarryforwardUsed: 0,
      priorLossesUtilised: [],
    };
  }

  // ── Transfer pricing awareness (S.33 ITA) ────────────────────────────────
  if (input.hasRelatedPartyTransactions) {
    transferPricingWarnings.push('⚠️ Transfer Pricing (S.33 ITA): You have transactions with related/associated parties. All such transactions MUST be at arm\'s length prices. TRA may adjust your income if prices differ from market rates.');
  }
  if (input.hasManagementFeesToParent) {
    transferPricingWarnings.push('⚠️ Management Fees: Fees paid to a parent/associate company require documentation proving arm\'s length pricing. Ensure you have a written agreement and evidence that the fee reflects market value.');
  }
  if (input.hasParentCompanyLoans) {
    transferPricingWarnings.push('⚠️ Related Party Loans: Loans from parent/associate are subject to both transfer pricing rules (arm\'s length interest rate) and thin-capitalisation limits (7:3 debt:equity ratio).');
  }

  // ── Income splitting awareness (S.34 ITA) ────────────────────────────────
  let incomeSplittingWarning: string | undefined;
  if (input.hasIncomeTransferToFamily) {
    incomeSplittingWarning = '⚠️ Income Splitting (S.34 ITA): Transferring business income to a spouse, family member, or related person is prohibited. TRA may re-characterise and re-allocate income to reflect the correct taxpayer.';
  }

  // Gross income
  const serviceRevenue = input.serviceRevenue ?? 0;
  const tradingStock = input.tradingStockSales ?? 0;
  if (serviceRevenue > 0) breakdown.push({ description: 'Service revenue', amount: serviceRevenue, notes: 'Taxable business income' });
  if (tradingStock > 0) breakdown.push({ description: 'Trading stock sales', amount: tradingStock, notes: 'Taxable business income' });
  const grossIncome = serviceRevenue + tradingStock;

  const deductions: Array<{ description: string; amount: number; notes: string }> = [];

  // Trading stock allowance
  if (input.openingStock !== undefined || input.purchases !== undefined) {
    const opening = input.openingStock ?? 0;
    const purchases = input.purchases ?? 0;
    const closing = input.closingStock ?? 0;
    const tradingStockAllowance = opening + purchases - closing;
    if (tradingStockAllowance > 0) {
      deductions.push({ description: 'Trading stock allowance', amount: tradingStockAllowance, notes: 'Opening + purchases − closing (lower of cost or market value)' });
    }
  }

  const exp = input.expenses;
  if (exp.rent) deductions.push({ description: 'Rent expense', amount: exp.rent, notes: 'Wholly and exclusively in production of income' });
  if (exp.salaries) deductions.push({ description: 'Salaries and wages', amount: exp.salaries, notes: 'Employment expense' });
  if (exp.utilities) deductions.push({ description: 'Utilities', amount: exp.utilities, notes: 'Business expense' });
  if (exp.repairs) deductions.push({ description: 'Repairs and maintenance', amount: exp.repairs, notes: 'Restoration only — not improvement or full replacement' });
  if (exp.rdExpenditure) deductions.push({ description: 'R&D expenditure', amount: exp.rdExpenditure, notes: 'Fully deductible in year incurred' });
  if (exp.environmentalExpenditure) deductions.push({ description: 'Environmental expenditure', amount: exp.environmentalExpenditure, notes: 'Fully deductible' });
  if (exp.agriculturalImprovement) deductions.push({ description: 'Agricultural improvement expenditure', amount: exp.agriculturalImprovement, notes: 'Fully deductible' });
  if (exp.retirementContributions) deductions.push({ description: 'Retirement contributions', amount: exp.retirementContributions, notes: 'Actual or statutory — whichever is lesser' });
  if (exp.otherAllowable) deductions.push({ description: 'Other allowable expenses', amount: exp.otherAllowable, notes: 'Wholly and exclusively in production of income' });

  // Interest — thin capitalisation 7:3 debt:equity cap
  if (exp.interest) {
    let interestAllowed = exp.interest;
    if (input.isExemptControlled && input.equityAmount && input.debtAmount) {
      const maxDebt = input.equityAmount * (7 / 3);
      if (input.debtAmount > maxDebt) {
        interestAllowed = Math.round(exp.interest * (maxDebt / input.debtAmount));
        deductions.push({ description: 'Interest expense (thin-cap adjusted)', amount: interestAllowed, notes: `Debt:equity cap 7:3 applied. Allowed: ${interestAllowed.toLocaleString()}` });
      } else {
        deductions.push({ description: 'Interest expense', amount: interestAllowed, notes: 'Within 7:3 debt:equity limit' });
      }
    } else {
      deductions.push({ description: 'Interest expense', amount: interestAllowed, notes: 'Wholly and exclusively in production of income' });
    }
  }

  // Donations
  const predonationIncome = grossIncome - deductions.reduce((s, d) => s + d.amount, 0);
  if (input.donations) {
    const tea = input.donations.teaDonations ?? 0;
    const other = input.donations.otherDonations ?? 0;
    const otherCap = Math.round(predonationIncome * 0.02);
    const otherAllowed = Math.min(other, otherCap);
    if (tea > 0) deductions.push({ description: 'Donations to TEA Education Fund', amount: tea, notes: 'Fully deductible' });
    if (other > 0) deductions.push({ description: `Other donations (capped at 2%)`, amount: otherAllowed, notes: `Requested: ${other.toLocaleString()}, Cap: ${otherCap.toLocaleString()}, Allowed: ${otherAllowed.toLocaleString()}` });
  }

  // Bad debts
  if (input.badDebts) {
    if (input.isAccrualBasis) {
      deductions.push({ description: 'Bad debts written off', amount: input.badDebts, notes: 'Accrual basis — deductible after all reasonable recovery steps taken' });
    } else {
      deductions.push({ description: 'Bad debts (DISALLOWED)', amount: 0, notes: 'Cash basis taxpayers cannot claim bad debt deductions' });
    }
  }

  // Depreciation — updated for Third Schedule classes
  const [depRates, writeOffThreshold] = await Promise.all([getDepreciationRates(), getWriteOffThreshold()]);
  let totalDepreciation = 0;
  let totalDisposalIncome = 0;
  for (const asset of (input.depreciableAssets ?? [])) {
    const dep = calculateDepreciation(asset, depRates, writeOffThreshold);
    totalDepreciation += dep.allowance;
    totalDisposalIncome += dep.disposalIncome;
    if (dep.allowance > 0) {
      deductions.push({
        description: `Depreciation — Class ${dep.class} (${(dep.rate * 100).toFixed(1)}%)`,
        amount: dep.allowance,
        notes: dep.writtenOff
          ? `Pool written off — remaining basis < TZS ${writeOffThreshold.toLocaleString()}`
          : `Pool basis: opening ${dep.openingBasis.toLocaleString()}, closing ${dep.closingBasis.toLocaleString()}`,
      });
    }
    if (dep.disposalIncome > 0) {
      breakdown.push({ description: `Disposal income — Class ${dep.class}`, amount: dep.disposalIncome, notes: 'Pool went negative on disposal — included as income' });
    }
  }

  const totalDeductionsBeforeLoss = deductions.reduce((s, d) => s + d.amount, 0);
  const grossIncomeTotal = grossIncome + totalDisposalIncome;
  let taxableIncome = Math.max(0, grossIncomeTotal - totalDeductionsBeforeLoss);

  // ── Loss carryforward (S.19 ITA) ─────────────────────────────────────────
  let lossCarryforwardUsed = 0;
  const priorLossesUtilised: LossCarryforwardEntry[] = [];
  if ((input.priorLosses ?? []).length > 0 && taxableIncome > 0) {
    let remaining = taxableIncome;
    for (const loss of (input.priorLosses ?? []).sort((a, b) => a.yearOfIncome - b.yearOfIncome)) {
      if (remaining <= 0) break;
      const used = Math.min(remaining, loss.remainingLoss);
      remaining -= used;
      lossCarryforwardUsed += used;
      priorLossesUtilised.push({ yearOfIncome: loss.yearOfIncome, remainingLoss: used });
      deductions.push({ description: `Loss carried forward from ${loss.yearOfIncome}`, amount: used, notes: 'Unrelieved loss from prior year — S.19 ITA' });
    }
    taxableIncome = remaining;

    // Perpetual loss warning (3+ consecutive years)
    if ((input.priorLosses ?? []).length >= 2) {
      transferPricingWarnings.push(`⚠️ Perpetual Loss Rule: You have losses from ${(input.priorLosses ?? []).length + 1}+ years. If 3 or more consecutive years of unrelieved losses, TRA may apply the 0.5% of turnover minimum tax rule.`);
    }
  }

  const totalDeductionsAmount = deductions.reduce((s, d) => s + d.amount, 0);

  // Load corporate tax rate
  const corpRule = await prisma.corporateRate.findFirst({ where: { entityType: 'Standard resident company', isActive: true } });
  const corpRate = Number(corpRule?.rate ?? 0.30);
  const taxPayable = Math.round(taxableIncome * corpRate);

  const allBreakdown = [
    ...breakdown,
    { description: 'TOTAL GROSS INCOME', amount: grossIncomeTotal, notes: '' },
    ...deductions.map(d => ({ ...d, amount: -d.amount })),
    { description: 'TAXABLE INCOME', amount: taxableIncome, notes: '' },
    { description: `Tax payable (${(corpRate * 100).toFixed(0)}%)`, amount: taxPayable, notes: '' },
  ];

  return {
    grossIncome: grossIncomeTotal,
    totalDeductions: totalDeductionsAmount,
    taxableIncome,
    taxPayable,
    breakdown: allBreakdown,
    explanation: `Gross income TZS ${grossIncomeTotal.toLocaleString()} less deductions TZS ${totalDeductionsAmount.toLocaleString()}${lossCarryforwardUsed > 0 ? ` (incl. prior losses TZS ${lossCarryforwardUsed.toLocaleString()})` : ''} = taxable income TZS ${taxableIncome.toLocaleString()}. Tax at ${(corpRate * 100).toFixed(0)}%: TZS ${taxPayable.toLocaleString()}.`,
    transferPricingWarnings,
    incomeSplittingWarning,
    lossCarryforwardUsed,
    priorLossesUtilised,
  };
}
