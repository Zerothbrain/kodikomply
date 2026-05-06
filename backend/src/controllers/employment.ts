import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IncomeItem {
  description: string;
  amount: number;
  isReimbursement?: boolean;
  actualExpense?: number;
}

interface Allowance {
  type: string;
  amount: number;
  isReimbursement?: boolean;
  actualExpense?: number;
}

interface Benefit {
  type: string;
  amount: number;
}

export interface EmploymentInput {
  isEmployed: boolean;
  isResident: boolean;
  employerIsResident?: boolean;
  monthlyBasicSalary: number;
  allowances?: Allowance[];
  benefits?: Benefit[];
  isGovernmentEmployee?: boolean;
  retirementContributionMonthly?: number;
  hasTerminalPayment?: boolean;
  directorFees?: number;
  otherIncome?: IncomeItem[];
}

interface BreakdownItem {
  description: string;
  amount: number;
  taxable: boolean;
  reason: string;
}

export interface EmploymentResult {
  grossIncome: number;
  taxableIncome: number;
  excludedAmounts: number;
  deductions: number;
  payeMonthly: number;
  payeAnnual: number;
  sdl: number;
  netIncome: number;
  effectiveRate: number;
  breakdown: BreakdownItem[];
  explanation: string;
}

const GOVERNMENT_EXEMPT_ALLOWANCES = ['housing', 'transport', 'responsibility', 'extra_duty', 'overtime', 'hardship', 'honoraria'];

function classifyAllowance(allowance: Allowance, isGovernmentEmployee: boolean): BreakdownItem {
  const { type, amount, isReimbursement, actualExpense } = allowance;

  if (isReimbursement) {
    const actual = actualExpense ?? 0;
    if (amount <= actual) {
      return {
        description: `${type} allowance (reimbursement)`,
        amount,
        taxable: false,
        reason: 'Exact reimbursement of actual expenditure — not taxable',
      };
    }
    const excess = amount - actual;
    return {
      description: `${type} allowance (excess over actual expense)`,
      amount: excess,
      taxable: true,
      reason: `Allowance (${amount.toLocaleString()}) exceeds actual expense (${actual.toLocaleString()}) — excess of ${excess.toLocaleString()} is taxable`,
    };
  }

  if (isGovernmentEmployee && GOVERNMENT_EXEMPT_ALLOWANCES.includes(type.toLowerCase())) {
    return {
      description: `${type} allowance (government)`,
      amount,
      taxable: false,
      reason: 'Government employee allowance — exempt from tax',
    };
  }

  const alwaysExempt = ['foreign_service', 'board_sitting', 'scholarship'];
  if (alwaysExempt.includes(type.toLowerCase())) {
    return {
      description: `${type} allowance`,
      amount,
      taxable: false,
      reason: 'Exempt category allowance under ITA',
    };
  }

  return {
    description: `${type} allowance`,
    amount,
    taxable: true,
    reason: 'Employment allowance included in taxable income',
  };
}

function classifyBenefit(benefit: Benefit, isGovernmentEmployee: boolean): BreakdownItem {
  const { type, amount } = benefit;

  if (type === 'medical' || type === 'cafeteria') {
    return {
      description: `${type} benefit`,
      amount,
      taxable: false,
      reason: 'Non-discriminatory employer benefit — not taxable',
    };
  }

  if (type === 'motor_vehicle_no_deduction') {
    return {
      description: 'Motor vehicle benefit (employer claims no deduction)',
      amount,
      taxable: false,
      reason: 'Employer claims no deduction — benefit is not taxable',
    };
  }

  if (type === 'government_residential_premises' && isGovernmentEmployee) {
    return {
      description: 'Government residential premises',
      amount,
      taxable: false,
      reason: 'Government residential premises — exempt benefit',
    };
  }

  return {
    description: `${type} benefit`,
    amount,
    taxable: true,
    reason: 'Employment benefit included in taxable income',
  };
}

async function getPAYEBands(): Promise<Array<{ min: number; max: number | null; rate: number }>> {
  const rules = await prisma.taxRule.findMany({
    where: { category: 'PAYE_BAND', isActive: true },
    orderBy: { minValue: 'asc' },
  });
  return rules.map(r => ({
    min: Number(r.minValue ?? 0),
    max: r.maxValue ? Number(r.maxValue) : null,
    rate: Number(r.rate ?? 0),
  }));
}

async function getSDLRate(): Promise<number> {
  const rule = await prisma.taxRule.findFirst({
    where: { category: 'SDL', isActive: true },
  });
  return Number(rule?.rate ?? 0.04);
}

export function calculatePAYEFromBands(
  monthlyTaxable: number,
  bands: Array<{ min: number; max: number | null; rate: number }>
): number {
  let tax = 0;
  for (const band of bands) {
    if (monthlyTaxable <= band.min) break;
    const upper = band.max ?? Infinity;
    const portion = Math.min(monthlyTaxable, upper) - band.min;
    tax += portion * band.rate;
  }
  return Math.round(tax);
}

export async function calculateEmployment(input: EmploymentInput): Promise<EmploymentResult> {
  const breakdown: BreakdownItem[] = [];

  if (!input.isEmployed) {
    return {
      grossIncome: 0, taxableIncome: 0, excludedAmounts: 0, deductions: 0,
      payeMonthly: 0, payeAnnual: 0, sdl: 0, netIncome: 0, effectiveRate: 0,
      breakdown: [],
      explanation: 'No employment income — not liable for PAYE.',
    };
  }

  if (!input.isResident && !input.employerIsResident) {
    return {
      grossIncome: 0, taxableIncome: 0, excludedAmounts: 0, deductions: 0,
      payeMonthly: 0, payeAnnual: 0, sdl: 0, netIncome: 0, effectiveRate: 0,
      breakdown: [],
      explanation: 'Non-resident employee with non-resident employer having no permanent establishment in Tanzania — not subject to PAYE.',
    };
  }

  const basicItem: BreakdownItem = {
    description: 'Basic salary',
    amount: input.monthlyBasicSalary,
    taxable: true,
    reason: 'Basic employment income — fully taxable',
  };
  breakdown.push(basicItem);

  if (input.directorFees && input.directorFees > 0) {
    breakdown.push({
      description: 'Director fees',
      amount: input.directorFees,
      taxable: true,
      reason: 'Director fees taxed at applicable PAYE rates',
    });
  }

  for (const allowance of (input.allowances ?? [])) {
    breakdown.push(classifyAllowance(allowance, input.isGovernmentEmployee ?? false));
  }

  for (const benefit of (input.benefits ?? [])) {
    breakdown.push(classifyBenefit(benefit, input.isGovernmentEmployee ?? false));
  }

  for (const item of (input.otherIncome ?? [])) {
    breakdown.push({
      description: item.description,
      amount: item.amount,
      taxable: true,
      reason: 'Other employment income',
    });
  }

  const grossIncome = breakdown.reduce((s, i) => s + i.amount, 0);
  const taxableItems = breakdown.filter(i => i.taxable);
  const nonTaxableItems = breakdown.filter(i => !i.taxable);
  const grossTaxable = taxableItems.reduce((s, i) => s + i.amount, 0);
  const excludedAmounts = nonTaxableItems.reduce((s, i) => s + i.amount, 0);

  const retirementDeduction = input.retirementContributionMonthly ?? 0;
  const deductions = retirementDeduction;

  if (retirementDeduction > 0) {
    breakdown.push({
      description: 'Retirement contribution (NSSF/approved fund)',
      amount: -retirementDeduction,
      taxable: false,
      reason: 'Deductible retirement contribution — reduces taxable income',
    });
  }

  const monthlyTaxable = Math.max(0, grossTaxable - deductions);

  const [bands, sdlRate] = await Promise.all([getPAYEBands(), getSDLRate()]);

  const payeMonthly = calculatePAYEFromBands(monthlyTaxable, bands);
  const payeAnnual = payeMonthly * 12;
  const sdl = Math.round(grossIncome * sdlRate);
  const netIncome = input.monthlyBasicSalary - payeMonthly - retirementDeduction;
  const effectiveRate = monthlyTaxable > 0 ? (payeMonthly / monthlyTaxable) * 100 : 0;

  return {
    grossIncome,
    taxableIncome: monthlyTaxable,
    excludedAmounts,
    deductions,
    payeMonthly,
    payeAnnual,
    sdl,
    netIncome,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
    explanation: `Monthly taxable income of TZS ${monthlyTaxable.toLocaleString()} after deducting retirement contributions of TZS ${retirementDeduction.toLocaleString()}. PAYE of TZS ${payeMonthly.toLocaleString()} per month (TZS ${payeAnnual.toLocaleString()} per year). SDL payable by employer: TZS ${sdl.toLocaleString()} per month (${(sdlRate * 100).toFixed(1)}% of gross payroll).`,
  };
}
