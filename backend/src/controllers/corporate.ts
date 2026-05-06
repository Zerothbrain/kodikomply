import prisma from '../lib/prisma';

export interface CorporateInput {
  entityType: string;
  taxableIncome: number;
  annualTurnover: number;
  priorYearLosses?: number;
  consecutiveLossYears?: number;
  isRepatriatedIncome?: boolean;
  installmentNumber?: number;
  estimatedAnnualTax?: number;
  taxAlreadyPaid?: number;
  remainingInstallments?: number;
  isAgriculturalSeasonal?: boolean;
  isExemptControlled?: boolean;
}

export interface CorporateResult {
  applicableRate: number;
  entityType: string;
  taxPayable: number;
  minimumTaxBasis?: string;
  installmentAmount?: number;
  isNilInstallment?: boolean;
  explanation: string;
}

export async function calculateCorporate(input: CorporateInput): Promise<CorporateResult> {
  // Load rates from DB
  const rateRecord = await prisma.corporateRate.findFirst({
    where: { entityType: { contains: input.entityType }, isActive: true },
    orderBy: { startDate: 'desc' },
  });

  let rate = rateRecord ? Number(rateRecord.rate) : 0.30;
  let minimumTaxBasis: string | undefined;

  // Perpetual unrelieved loss: 3 consecutive years → 0.5% of turnover
  if ((input.consecutiveLossYears ?? 0) >= 3 && input.taxableIncome <= 0) {
    const perpetualLossRecord = await prisma.corporateRate.findFirst({
      where: { entityType: { contains: 'unrelieved loss' }, isActive: true },
    });
    rate = Number(perpetualLossRecord?.rate ?? 0.005);
    const taxPayable = Math.round(input.annualTurnover * rate);
    minimumTaxBasis = `0.5% of turnover (perpetual unrelieved loss — 3 consecutive loss years)`;
    return {
      applicableRate: rate,
      entityType: input.entityType,
      taxPayable,
      minimumTaxBasis,
      explanation: `Perpetual unrelieved loss applies after ${input.consecutiveLossYears} consecutive loss years. Minimum tax: ${(rate * 100).toFixed(1)}% of turnover = TZS ${taxPayable.toLocaleString()}.`,
    };
  }

  // Repatriated income of domestic permanent establishment
  if (input.isRepatriatedIncome) {
    const repatRate = 0.10;
    const taxPayable = Math.round(input.taxableIncome * repatRate);
    return {
      applicableRate: repatRate,
      entityType: 'Domestic permanent establishment (repatriated income)',
      taxPayable,
      explanation: `Repatriated income of domestic permanent establishment taxed at 10%. Tax: TZS ${taxPayable.toLocaleString()}.`,
    };
  }

  const taxPayable = Math.round(Math.max(0, input.taxableIncome - (input.priorYearLosses ?? 0)) * rate);

  // Quarterly installment calculation
  if (input.installmentNumber !== undefined) {
    const A = input.estimatedAnnualTax ?? 0;
    const C = input.taxAlreadyPaid ?? 0;
    const B = input.remainingInstallments ?? 1;

    // Agricultural seasonal: Q1 and Q2 = NIL
    if (input.isAgriculturalSeasonal && (input.installmentNumber === 1 || input.installmentNumber === 2)) {
      return {
        applicableRate: rate,
        entityType: input.entityType,
        taxPayable,
        installmentAmount: 0,
        isNilInstallment: true,
        explanation: `Agricultural seasonal business: Q${input.installmentNumber} installment is NIL. Q3 = 75% of estimated tax, Q4 = balance.`,
      };
    }

    let installmentAmount = Math.round((A - C) / B);

    // Nil thresholds
    const isNilInstallment = A <= 50_000 || installmentAmount <= 12_500;
    if (isNilInstallment) installmentAmount = 0;

    return {
      applicableRate: rate,
      entityType: input.entityType,
      taxPayable,
      installmentAmount,
      isNilInstallment,
      explanation: `Quarterly installment ${input.installmentNumber}: (A ${A.toLocaleString()} − C ${C.toLocaleString()}) ÷ B ${B} = TZS ${installmentAmount.toLocaleString()}${isNilInstallment ? ' (NIL — below threshold)' : ''}.`,
    };
  }

  return {
    applicableRate: rate,
    entityType: rateRecord?.entityType ?? input.entityType,
    taxPayable,
    explanation: `${rateRecord?.entityType ?? input.entityType}: corporate tax at ${(rate * 100).toFixed(0)}% on taxable income of TZS ${Math.max(0, input.taxableIncome - (input.priorYearLosses ?? 0)).toLocaleString()} = TZS ${taxPayable.toLocaleString()}.`,
  };
}
