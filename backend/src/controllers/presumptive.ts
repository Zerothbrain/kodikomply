import prisma from '../lib/prisma';

export interface PresumptiveInput {
  annualTurnover: number;
  isS43Compliant: boolean; // keeps proper records under S.43 TAA
  entityType: 'individual' | 'partnership' | 'other'; // companies/NGOs not eligible
}

export interface PresumptiveBand {
  range: string;
  nonS43Tax: string;
  s43Tax: string;
}

export interface PresumptiveResult {
  annualTurnover: number;
  isS43Compliant: boolean;
  isEligible: boolean;
  isNil: boolean;
  taxPayable: number;
  effectiveRate: number;
  band: string;
  calculation: string;
  complianceNote: string;
  savingsByComplying: number;
  deadlineNote: string;
  statuteRef: string;
  fullTable: PresumptiveBand[];
}

interface DBRule {
  minValue: number | null;
  maxValue: number | null;
  rate: number | null;
  fixedAmount: number | null;
  notes: string | null;
  name: string;
}

function computeS43Tax(turnover: number, rules: DBRule[]): { tax: number; band: string; calc: string } {
  const rule = rules.find(r =>
    turnover >= (r.minValue ?? 0) && turnover <= (r.maxValue ?? Infinity)
  );
  if (!rule) return { tax: 0, band: 'Unknown', calc: 'Rate not found' };

  // Parse excess from notes: "...|excess:4000000"
  const excessMatch = rule.notes?.match(/excess:(\d+)/);
  const excessOver = excessMatch ? Number(excessMatch[1]) : 0;

  if (rule.rate === 0 || (!rule.rate && !rule.fixedAmount)) {
    return { tax: 0, band: rule.name, calc: 'NIL — turnover below TZS 4,000,000 threshold' };
  }

  let tax = 0;
  let calc = '';

  if (rule.fixedAmount && rule.rate && excessOver > 0) {
    const excess = Math.max(0, turnover - excessOver);
    tax = rule.fixedAmount + Math.round(excess * rule.rate);
    calc = `TZS ${rule.fixedAmount.toLocaleString()} + ${(rule.rate * 100).toFixed(1)}% × TZS ${excess.toLocaleString()} excess over TZS ${excessOver.toLocaleString()}`;
  } else if (rule.rate && !rule.fixedAmount && excessOver > 0) {
    const excess = Math.max(0, turnover - excessOver);
    tax = Math.round(excess * rule.rate);
    calc = `${(rule.rate * 100).toFixed(1)}% × TZS ${excess.toLocaleString()} excess over TZS ${excessOver.toLocaleString()}`;
  } else if (rule.rate && !rule.fixedAmount) {
    tax = Math.round(turnover * rule.rate);
    calc = `${(rule.rate * 100).toFixed(1)}% × TZS ${turnover.toLocaleString()} turnover`;
  }

  return { tax, band: rule.name, calc };
}

function computeNonS43Tax(turnover: number, rules: DBRule[]): { tax: number; band: string; calc: string } {
  const rule = rules.find(r =>
    turnover >= (r.minValue ?? 0) && turnover <= (r.maxValue ?? Infinity)
  );
  if (!rule) return { tax: 0, band: 'Unknown', calc: 'Rate not found' };

  if (rule.rate === 0 || (!rule.rate && !rule.fixedAmount)) {
    return { tax: 0, band: rule.name, calc: 'NIL — turnover below TZS 4,000,000 threshold' };
  }

  if (rule.fixedAmount && !rule.rate) {
    return {
      tax: rule.fixedAmount,
      band: rule.name,
      calc: `Fixed amount TZS ${rule.fixedAmount.toLocaleString()} (non-S.43 penalty rate)`,
    };
  }

  const tax = Math.round(turnover * (rule.rate ?? 0));
  return {
    tax,
    band: rule.name,
    calc: `${((rule.rate ?? 0) * 100).toFixed(1)}% × TZS ${turnover.toLocaleString()} turnover`,
  };
}

function buildFullTable(nonS43Rules: DBRule[], s43Rules: DBRule[]): PresumptiveBand[] {
  return [
    { range: 'Below TZS 4,000,000',        nonS43Tax: 'NIL',          s43Tax: 'NIL' },
    { range: 'TZS 4,000,001 – 7,000,000',  nonS43Tax: 'TZS 100,000',  s43Tax: '3% of excess over TZS 4M' },
    { range: 'TZS 7,000,001 – 11,000,000', nonS43Tax: 'TZS 250,000',  s43Tax: 'TZS 90,000 + 3% of excess over TZS 7M' },
    { range: 'TZS 11,000,001 – 100,000,000', nonS43Tax: '3.5% of turnover', s43Tax: '3.5% of turnover' },
  ];
}

export async function calculatePresumptive(input: PresumptiveInput): Promise<PresumptiveResult> {
  const { annualTurnover, isS43Compliant } = input;

  const [nonS43Rules, s43Rules] = await Promise.all([
    prisma.taxRule.findMany({ where: { category: 'PRESUMPTIVE', isActive: true }, orderBy: { minValue: 'asc' } }),
    prisma.taxRule.findMany({ where: { category: 'PRESUMPTIVE_S43', isActive: true }, orderBy: { minValue: 'asc' } }),
  ]);

  const isEligible = annualTurnover <= 100_000_000;
  const isNil = annualTurnover < 4_000_000;

  if (!isEligible) {
    return {
      annualTurnover,
      isS43Compliant,
      isEligible: false,
      isNil: false,
      taxPayable: 0,
      effectiveRate: 0,
      band: 'Above TZS 100M',
      calculation: 'Presumptive tax does not apply — turnover exceeds TZS 100,000,000. Business income tax applies under S.4(2) ITA.',
      complianceNote: 'You are required to file a standard business income tax return by June 30.',
      savingsByComplying: 0,
      deadlineNote: 'Annual return — June 30',
      statuteRef: 'S.4(2) ITA Cap 332',
      fullTable: buildFullTable(nonS43Rules, s43Rules),
    };
  }

  const s43Result = computeS43Tax(annualTurnover, s43Rules);
  const nonS43Result = computeNonS43Tax(annualTurnover, nonS43Rules);

  const taxPayable = isS43Compliant ? s43Result.tax : nonS43Result.tax;
  const effectiveRate = annualTurnover > 0 ? taxPayable / annualTurnover : 0;
  const savingsByComplying = Math.max(0, nonS43Result.tax - s43Result.tax);

  const complianceNote = isS43Compliant
    ? 'You qualify for the lower S.43 TAA compliant rate because you maintain proper records (stock records, cashbook, and basic accounts).'
    : `You are paying the higher non-compliant rate. Maintaining proper records under S.43 TAA would save you TZS ${savingsByComplying.toLocaleString()} this year.`;

  return {
    annualTurnover,
    isS43Compliant,
    isEligible: true,
    isNil,
    taxPayable,
    effectiveRate,
    band: isS43Compliant ? s43Result.band : nonS43Result.band,
    calculation: isS43Compliant ? s43Result.calc : nonS43Result.calc,
    complianceNote,
    savingsByComplying,
    deadlineNote: 'Annual — June 30 (S.90 ITA)',
    statuteRef: 'S.4(2) First Schedule ITA Cap 332 · S.43 TAA Cap 438',
    fullTable: buildFullTable(nonS43Rules, s43Rules),
  };
}
