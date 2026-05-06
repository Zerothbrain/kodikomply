import prisma from '../lib/prisma';
import { calculatePAYEFromBands } from './employment';

export interface Partner {
  name: string;
  percentageShare: number;
  tinNumber?: string;
}

export interface PartnershipInput {
  partnershipName: string;
  yearOfIncome: number;
  grossBusinessIncome: number;
  allowableDeductions: number;
  whtPaidByPartnership: number;
  partners: Partner[];
}

export interface PartnerResult {
  partnerName: string;
  percentageShare: number;
  allocatedIncome: number;
  allocatedWHTCredit: number;
  estimatedPersonalTax: number;
  netTaxPayable: number;
}

export interface PartnershipResult {
  partnershipIncome: number;
  partnershipLoss: number;
  isLoss: boolean;
  partners: PartnerResult[];
  totalWHTAllocated: number;
  note: string;
  explanation: string;
  breakdown: Array<{ description: string; amount: number }>;
}

export async function calculatePartnership(input: PartnershipInput): Promise<PartnershipResult> {
  // Validate shares sum to 100%
  const totalShare = input.partners.reduce((s, p) => s + p.percentageShare, 0);
  if (Math.abs(totalShare - 100) > 0.01) {
    throw new Error(`Partner shares must sum to 100%. Currently: ${totalShare}%`);
  }

  const partnershipIncome = input.grossBusinessIncome - input.allowableDeductions;
  const isLoss = partnershipIncome < 0;
  const netAmount = partnershipIncome;

  // Get PAYE bands for estimating each partner's tax
  const bands = await prisma.taxRule.findMany({
    where: { category: 'PAYE_BAND', isActive: true },
    orderBy: { minValue: 'asc' },
  });
  const monthlyBands = bands.map(b => ({
    min: Number(b.minValue ?? 0),
    max: b.maxValue ? Number(b.maxValue) : null,
    rate: Number(b.rate ?? 0),
  }));

  const partnerResults: PartnerResult[] = input.partners.map(partner => {
    const share = partner.percentageShare / 100;
    const allocatedIncome = Math.round(netAmount * share);
    const allocatedWHTCredit = Math.round(input.whtPaidByPartnership * share);

    // Estimate personal tax on allocated income (treated as annual business income)
    // For individual partners: use PAYE bands on monthly equivalent
    const monthlyEquivalent = allocatedIncome > 0 ? allocatedIncome / 12 : 0;
    const monthlyPAYE = allocatedIncome > 0 ? calculatePAYEFromBands(monthlyEquivalent, monthlyBands) : 0;
    const estimatedPersonalTax = monthlyPAYE * 12;
    const netTaxPayable = Math.max(0, estimatedPersonalTax - allocatedWHTCredit);

    return {
      partnerName: partner.name,
      percentageShare: partner.percentageShare,
      allocatedIncome,
      allocatedWHTCredit,
      estimatedPersonalTax,
      netTaxPayable,
    };
  });

  const breakdown: Array<{ description: string; amount: number }> = [
    { description: 'Gross partnership business income', amount: input.grossBusinessIncome },
    { description: 'Allowable deductions', amount: -input.allowableDeductions },
    { description: `Net partnership ${isLoss ? 'LOSS' : 'INCOME'}`, amount: netAmount },
    { description: 'WHT paid by partnership (allocated to partners)', amount: input.whtPaidByPartnership },
    ...partnerResults.map(p => ({
      description: `${p.partnerName} (${p.percentageShare}%) — allocated ${isLoss ? 'loss' : 'income'}`,
      amount: p.allocatedIncome,
    })),
  ];

  return {
    partnershipIncome: Math.max(0, netAmount),
    partnershipLoss: Math.max(0, -netAmount),
    isLoss,
    partners: partnerResults,
    totalWHTAllocated: input.whtPaidByPartnership,
    note: 'Partnership itself pays NO income tax — tax flows to individual partners. Each partner\'s share is treated as derived at end of partnership\'s year of income. S.48–51 ITA.',
    explanation: `Partnership "${input.partnershipName}" — Year of income ${input.yearOfIncome}. Gross income: TZS ${input.grossBusinessIncome.toLocaleString()}, deductions: TZS ${input.allowableDeductions.toLocaleString()}, net ${isLoss ? 'loss' : 'income'}: TZS ${Math.abs(netAmount).toLocaleString()}. Allocated to ${input.partners.length} partners.`,
    breakdown,
  };
}
