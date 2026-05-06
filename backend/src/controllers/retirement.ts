import prisma from '../lib/prisma';

// ── RETIREMENT CONTRIBUTIONS DEDUCTION (S.61 ITA) ─────────────────────────────

export interface RetirementContributionInput {
  actualContribution: number;
  grossSalary: number;
  fundName: string;
  isApprovedFund: boolean;
  includesEmployerContribution: boolean;
}

export interface RetirementContributionResult {
  allowableDeduction: number;
  excessContribution: number;
  statutoryAmount: number;
  explanation: string;
  breakdown: Array<{ description: string; amount: number }>;
}

export async function calculateRetirementContribution(input: RetirementContributionInput): Promise<RetirementContributionResult> {
  if (!input.isApprovedFund) {
    return {
      allowableDeduction: 0,
      excessContribution: input.actualContribution,
      statutoryAmount: 0,
      explanation: 'Only contributions to approved retirement funds are deductible. Non-approved fund contributions are NOT deductible.',
      breakdown: [{ description: 'Non-approved fund — NO deduction', amount: 0 }],
    };
  }

  // Load NSSF rate from DB
  const nssf = await prisma.taxRule.findFirst({ where: { category: 'NSSF_RATE', name: { contains: 'Employee' }, isActive: true } });
  const employeeRate = Number(nssf?.rate ?? 0.10);

  const employerRule = await prisma.taxRule.findFirst({ where: { category: 'NSSF_RATE', name: { contains: 'Employer' }, isActive: true } });
  const employerRate = Number(employerRule?.rate ?? 0.10);

  const statutoryEmployee = Math.round(input.grossSalary * employeeRate);
  const statutoryEmployer = input.includesEmployerContribution ? Math.round(input.grossSalary * employerRate) : 0;
  const statutoryTotal = statutoryEmployee + statutoryEmployer;

  // Deduction = LOWER of actual OR statutory
  const allowableDeduction = Math.min(input.actualContribution, statutoryTotal);
  const excessContribution = Math.max(0, input.actualContribution - statutoryTotal);

  return {
    allowableDeduction,
    excessContribution,
    statutoryAmount: statutoryTotal,
    explanation: `Fund: ${input.fundName}. Actual contribution: TZS ${input.actualContribution.toLocaleString()}. Statutory (${(employeeRate * 100).toFixed(0)}% employee${input.includesEmployerContribution ? ` + ${(employerRate * 100).toFixed(0)}% employer` : ''}): TZS ${statutoryTotal.toLocaleString()}. Deduction = lower of actual/statutory = TZS ${allowableDeduction.toLocaleString()}.`,
    breakdown: [
      { description: 'Actual contribution', amount: input.actualContribution },
      { description: `Statutory employee contribution (${(employeeRate * 100).toFixed(0)}%)`, amount: statutoryEmployee },
      ...(input.includesEmployerContribution ? [{ description: `Statutory employer contribution (${(employerRate * 100).toFixed(0)}%)`, amount: statutoryEmployer }] : []),
      { description: 'Statutory total', amount: statutoryTotal },
      { description: 'ALLOWABLE DEDUCTION (lower of actual vs statutory)', amount: allowableDeduction },
      ...(excessContribution > 0 ? [{ description: 'Excess (NOT deductible)', amount: excessContribution }] : []),
    ],
  };
}

// ── RETIREMENT PAYMENTS TAXATION (S.63 ITA) ────────────────────────────────────

export interface RetirementPaymentInput {
  paymentAmount: number;
  isFromResidentFund: boolean;
  isApprovedFund: boolean;
  totalContributionsMade: number;
  isFromNonResidentFund: boolean;
}

export interface RetirementPaymentResult {
  taxableAmount: number;
  exemptAmount: number;
  isExempt: boolean;
  reason: string;
  explanation: string;
  breakdown: Array<{ description: string; amount: number }>;
}

export function calculateRetirementPayment(input: RetirementPaymentInput): RetirementPaymentResult {
  // From resident fund (approved or unapproved) → EXEMPT
  if (input.isFromResidentFund) {
    return {
      taxableAmount: 0,
      exemptAmount: input.paymentAmount,
      isExempt: true,
      reason: 'Payment from resident fund (approved or unapproved) — exempt in hands of payee. S.63 ITA.',
      explanation: `Retirement payment of TZS ${input.paymentAmount.toLocaleString()} from a resident fund is fully exempt from tax.`,
      breakdown: [{ description: 'Resident fund payment — EXEMPT', amount: 0 }],
    };
  }

  // From non-resident approved fund → TAXABLE
  if (input.isFromNonResidentFund && input.isApprovedFund) {
    return {
      taxableAmount: input.paymentAmount,
      exemptAmount: 0,
      isExempt: false,
      reason: 'Payment from non-resident approved fund — fully taxable in Tanzania. S.63 ITA.',
      explanation: `TZS ${input.paymentAmount.toLocaleString()} from non-resident approved fund is taxable in Tanzania.`,
      breakdown: [{ description: 'Non-resident approved fund payment — TAXABLE', amount: input.paymentAmount }],
    };
  }

  // From non-resident unapproved fund — only gains taxable
  if (input.isFromNonResidentFund && !input.isApprovedFund) {
    const gain = Math.max(0, input.paymentAmount - input.totalContributionsMade);
    return {
      taxableAmount: gain,
      exemptAmount: input.totalContributionsMade,
      isExempt: gain === 0,
      reason: `Non-resident unapproved fund — only gains (payments exceeding contributions) are taxable.`,
      explanation: `Payment TZS ${input.paymentAmount.toLocaleString()} less contributions TZS ${input.totalContributionsMade.toLocaleString()} = taxable gain TZS ${gain.toLocaleString()}.`,
      breakdown: [
        { description: 'Total payment received', amount: input.paymentAmount },
        { description: 'Less: own contributions (return of capital)', amount: -input.totalContributionsMade },
        { description: 'TAXABLE GAIN', amount: gain },
      ],
    };
  }

  return {
    taxableAmount: 0,
    exemptAmount: input.paymentAmount,
    isExempt: true,
    reason: 'Exempt',
    explanation: 'Payment is exempt.',
    breakdown: [{ description: 'EXEMPT', amount: 0 }],
  };
}
