import prisma from '../lib/prisma';

// ── MOTOR VEHICLE BENEFIT (S.27(1)(a) + Fifth Schedule ITA) ──────────────────

export interface VehicleBenefitInput {
  engineCC: number;
  vehicleAgeYears: number;
  employerClaimsDeduction: boolean;
}

export interface VehicleBenefitResult {
  monthlyBenefit: number;
  annualBenefit: number;
  isTaxable: boolean;
  taxableAmount: number;
  explanation: string;
  breakdown: Array<{ description: string; amount: number }>;
}

export async function calculateVehicleBenefit(input: VehicleBenefitInput): Promise<VehicleBenefitResult> {
  if (!input.employerClaimsDeduction) {
    return {
      monthlyBenefit: 0,
      annualBenefit: 0,
      isTaxable: false,
      taxableAmount: 0,
      explanation: 'Employer does not claim deduction for vehicle — benefit is NIL. S.27(1)(a) ITA.',
      breakdown: [{ description: 'Employer claims no deduction → benefit = NIL', amount: 0 }],
    };
  }

  // Load Fifth Schedule table from DB (VehicleBenefitTable)
  const rows = await prisma.vehicleBenefitTable.findMany({
    where: { isActive: true },
    orderBy: { engineSizeFrom: 'asc' },
  });

  const fallbackRows = [
    { engineSizeFrom: 0, engineSizeTo: 1000, monthlyNewVehicle: 250000, monthlyOldVehicle: 125000, vehicleAgeThreshold: 5 },
    { engineSizeFrom: 1001, engineSizeTo: 2000, monthlyNewVehicle: 500000, monthlyOldVehicle: 250000, vehicleAgeThreshold: 5 },
    { engineSizeFrom: 2001, engineSizeTo: 3000, monthlyNewVehicle: 1000000, monthlyOldVehicle: 500000, vehicleAgeThreshold: 5 },
    { engineSizeFrom: 3001, engineSizeTo: null, monthlyNewVehicle: 1500000, monthlyOldVehicle: 750000, vehicleAgeThreshold: 5 },
  ];

  const tableRows = rows.length > 0 ? rows : fallbackRows;
  const ageThreshold = tableRows[0]?.vehicleAgeThreshold ?? 5;
  const isOld = input.vehicleAgeYears > ageThreshold;
  let monthlyBenefit = 0;
  let ccBand = '';

  for (const row of tableRows) {
    if (row.engineSizeTo === null || input.engineCC <= row.engineSizeTo) {
      monthlyBenefit = isOld ? row.monthlyOldVehicle : row.monthlyNewVehicle;
      ccBand = row.engineSizeTo ? `≤ ${row.engineSizeTo}cc` : `> ${row.engineSizeFrom - 1}cc`;
      break;
    }
  }

  const annualBenefit = monthlyBenefit * 12;

  return {
    monthlyBenefit,
    annualBenefit,
    isTaxable: true,
    taxableAmount: annualBenefit,
    explanation: `Vehicle engine: ${input.engineCC}cc (${ccBand}), age: ${input.vehicleAgeYears} years (${isOld ? '> 5 years' : '≤ 5 years'}). Employer claims deduction → taxable benefit per Fifth Schedule: TZS ${monthlyBenefit.toLocaleString()}/month = TZS ${annualBenefit.toLocaleString()}/year.`,
    breakdown: [
      { description: 'Engine size band', amount: 0 },
      { description: `Monthly benefit (Fifth Schedule — ${isOld ? 'vehicle >5 years' : 'vehicle ≤5 years'})`, amount: monthlyBenefit },
      { description: 'Annual taxable benefit (× 12)', amount: annualBenefit },
    ],
  };
}

// ── RESIDENTIAL PREMISES BENEFIT (S.27(1)(c) ITA) ─────────────────────────────

export interface ResidentialBenefitInput {
  marketRentalValue: number;
  employeeTotalIncome: number;
  rentPaidByEmployee: number;
  isGovernmentEmployee: boolean;
  isGovernmentPremises: boolean;
  occupiedMonths?: number;
}

export interface ResidentialBenefitResult {
  taxableBenefit: number;
  isExempt: boolean;
  exemptionReason?: string;
  explanation: string;
  breakdown: Array<{ description: string; amount: number }>;
}

export async function calculateResidentialBenefit(input: ResidentialBenefitInput): Promise<ResidentialBenefitResult> {
  if (input.isGovernmentEmployee || input.isGovernmentPremises) {
    return {
      taxableBenefit: 0,
      isExempt: true,
      exemptionReason: 'Government employer — residential premises benefit is exempt.',
      explanation: 'Government employees in government-provided premises are exempt from residential premises benefit taxation.',
      breakdown: [{ description: 'Government premises — EXEMPT', amount: 0 }],
    };
  }

  // Load 15% rate and TZS 600,000 threshold from DB
  const rule = await prisma.taxRule.findFirst({ where: { category: 'RESIDENTIAL_BENEFIT', isActive: true } });
  const incomePercent = Number(rule?.rate ?? 0.15);
  const minimumThreshold = Number(rule?.fixedAmount ?? 600000);

  const months = input.occupiedMonths ?? 12;
  const proRataMarketRent = (input.marketRentalValue / 12) * months;

  const percentOfIncome = input.employeeTotalIncome * incomePercent;
  const greaterOfTwoLimits = Math.max(percentOfIncome, minimumThreshold);
  const lowerCap = Math.min(proRataMarketRent, greaterOfTwoLimits);
  const taxableBenefit = Math.max(0, lowerCap - input.rentPaidByEmployee);

  return {
    taxableBenefit,
    isExempt: false,
    explanation: `Market rent for period: TZS ${proRataMarketRent.toLocaleString()}. ${(incomePercent * 100).toFixed(0)}% of income: TZS ${percentOfIncome.toLocaleString()}. Greater of ${(incomePercent * 100).toFixed(0)}%/TZS ${minimumThreshold.toLocaleString()}: TZS ${greaterOfTwoLimits.toLocaleString()}. Cap (lower of): TZS ${lowerCap.toLocaleString()}. Less rent paid: TZS ${input.rentPaidByEmployee.toLocaleString()}. Taxable benefit: TZS ${taxableBenefit.toLocaleString()}.`,
    breakdown: [
      { description: `Market rental value (${months} months)`, amount: proRataMarketRent },
      { description: `${(incomePercent * 100).toFixed(0)}% of employee total income`, amount: percentOfIncome },
      { description: `Minimum threshold (TZS ${minimumThreshold.toLocaleString()})`, amount: minimumThreshold },
      { description: 'Greater of % or threshold', amount: greaterOfTwoLimits },
      { description: 'Lower of (market rent vs greater-of)', amount: lowerCap },
      { description: 'Less: rent paid by employee', amount: -input.rentPaidByEmployee },
      { description: 'TAXABLE BENEFIT', amount: taxableBenefit },
    ],
  };
}

// ── LOW INTEREST LOAN BENEFIT (S.27(1)(b) ITA) ────────────────────────────────

export interface LoanBenefitInput {
  loanAmount: number;
  loanTermMonths: number;
  actualRateCharged: number;
  basicMonthlySalary: number;
}

export interface LoanBenefitResult {
  taxableBenefit: number;
  isExempt: boolean;
  exemptionReason?: string;
  statutoryRate: number;
  explanation: string;
  breakdown: Array<{ description: string; amount: number }>;
}

export async function calculateLoanBenefit(input: LoanBenefitInput): Promise<LoanBenefitResult> {
  // Exempt if term < 12 months AND total loans < 3 months basic salary
  const threeMonthsSalary = input.basicMonthlySalary * 3;
  if (input.loanTermMonths < 12 && input.loanAmount < threeMonthsSalary) {
    return {
      taxableBenefit: 0,
      isExempt: true,
      exemptionReason: `Loan term (${input.loanTermMonths} months) < 12 months AND loan amount (TZS ${input.loanAmount.toLocaleString()}) < 3× basic salary (TZS ${threeMonthsSalary.toLocaleString()}).`,
      statutoryRate: 0,
      explanation: 'Low interest loan benefit is exempt — short-term loan below 3-month salary threshold.',
      breakdown: [{ description: 'Loan is exempt (short-term + below threshold)', amount: 0 }],
    };
  }

  const statRule = await prisma.taxRule.findFirst({ where: { category: 'INTEREST_RATE', isActive: true } });
  const statutoryRate = Number(statRule?.rate ?? 0.12);

  const annualInterestAtStatutory = input.loanAmount * statutoryRate;
  const annualInterestActual = input.loanAmount * input.actualRateCharged;
  const taxableBenefit = Math.max(0, annualInterestAtStatutory - annualInterestActual);

  return {
    taxableBenefit,
    isExempt: false,
    statutoryRate,
    explanation: `Loan: TZS ${input.loanAmount.toLocaleString()} for ${input.loanTermMonths} months. Statutory rate: ${(statutoryRate * 100).toFixed(1)}%, actual: ${(input.actualRateCharged * 100).toFixed(1)}%. Taxable benefit = (statutory − actual) × loan amount = TZS ${taxableBenefit.toLocaleString()}.`,
    breakdown: [
      { description: 'Loan amount', amount: input.loanAmount },
      { description: `Interest at statutory rate (${(statutoryRate * 100).toFixed(1)}%)`, amount: annualInterestAtStatutory },
      { description: `Interest at actual rate (${(input.actualRateCharged * 100).toFixed(1)}%)`, amount: annualInterestActual },
      { description: 'TAXABLE BENEFIT (statutory − actual)', amount: taxableBenefit },
    ],
  };
}
