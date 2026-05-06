// ── FOREIGN TAX RELIEF (S.98 ITA) ─────────────────────────────────────────────
// Only available to RESIDENT persons (not partnerships)

export interface ForeignTaxReliefInput {
  isResident: boolean;
  foreignCountry: string;
  foreignIncome: number;
  foreignTaxPaid: number;
  totalTanzaniaIncome: number;
  tanzaniaTaxPayable: number;
  electToDeductInstead?: boolean;
}

export interface ForeignTaxReliefResult {
  isEligible: boolean;
  ineligibilityReason?: string;
  averageTanzaniaRate: number;
  creditLimit: number;
  actualCredit: number;
  unrelievedForeignTax: number;
  taxSaving: number;
  finalTaxPayable: number;
  canCarryForward: boolean;
  deductionAlternative: number;
  explanation: string;
  breakdown: Array<{ description: string; amount: number; notes?: string }>;
}

export function calculateForeignTaxRelief(input: ForeignTaxReliefInput): ForeignTaxReliefResult {
  if (!input.isResident) {
    return {
      isEligible: false,
      ineligibilityReason: 'Foreign tax relief is only available to RESIDENT persons. Non-residents are not eligible.',
      averageTanzaniaRate: 0,
      creditLimit: 0,
      actualCredit: 0,
      unrelievedForeignTax: 0,
      taxSaving: 0,
      finalTaxPayable: input.tanzaniaTaxPayable,
      canCarryForward: false,
      deductionAlternative: 0,
      explanation: 'Not eligible — non-resident person.',
      breakdown: [],
    };
  }

  if (input.totalTanzaniaIncome <= 0 || input.tanzaniaTaxPayable <= 0) {
    return {
      isEligible: false,
      ineligibilityReason: 'No Tanzania tax liability — no foreign tax credit available.',
      averageTanzaniaRate: 0,
      creditLimit: 0,
      actualCredit: 0,
      unrelievedForeignTax: input.foreignTaxPaid,
      taxSaving: 0,
      finalTaxPayable: 0,
      canCarryForward: true,
      deductionAlternative: 0,
      explanation: 'No Tanzania income tax payable — no credit can be utilised. Unrelieved amount can be carried forward.',
      breakdown: [],
    };
  }

  // Average TZ rate = (TZ income tax payable ÷ total income) × 100
  const averageTanzaniaRate = input.tanzaniaTaxPayable / input.totalTanzaniaIncome;

  // Credit limit = lower of: (i) foreign tax paid, or (ii) avg TZ rate × taxable foreign income
  const creditByRate = averageTanzaniaRate * input.foreignIncome;
  const creditLimit = Math.min(input.foreignTaxPaid, creditByRate);
  const actualCredit = creditLimit;
  const unrelievedForeignTax = Math.max(0, input.foreignTaxPaid - creditLimit);
  const finalTaxPayable = Math.max(0, input.tanzaniaTaxPayable - actualCredit);
  const taxSaving = input.tanzaniaTaxPayable - finalTaxPayable;

  // Alternative: deduct foreign tax instead of credit (cannot do both)
  const deductionAlternative = input.electToDeductInstead ? input.foreignTaxPaid : 0;

  const breakdown: Array<{ description: string; amount: number; notes?: string }> = [
    { description: 'Total Tanzania income (incl. foreign)', amount: input.totalTanzaniaIncome },
    { description: 'Tanzania tax payable (before relief)', amount: input.tanzaniaTaxPayable },
    { description: `Average TZ rate (${(averageTanzaniaRate * 100).toFixed(2)}%)`, amount: 0, notes: 'tax payable ÷ total income' },
    { description: 'Foreign income earned', amount: input.foreignIncome },
    { description: 'Foreign tax paid', amount: input.foreignTaxPaid },
    { description: `Credit by average rate (${(averageTanzaniaRate * 100).toFixed(2)}% × foreign income)`, amount: creditByRate },
    { description: 'CREDIT LIMIT (lower of foreign tax paid vs rate × income)', amount: creditLimit },
    { description: 'Less: credit applied', amount: -actualCredit },
    { description: 'FINAL TAX PAYABLE', amount: finalTaxPayable },
    { description: 'Unrelieved foreign tax (carry forward to next year)', amount: unrelievedForeignTax },
  ];

  if (input.electToDeductInstead) {
    breakdown.push({ description: 'ALTERNATIVE: deduct foreign tax (if election made)', amount: -deductionAlternative, notes: 'Cannot claim BOTH credit and deduction' });
  }

  return {
    isEligible: true,
    averageTanzaniaRate,
    creditLimit,
    actualCredit,
    unrelievedForeignTax,
    taxSaving,
    finalTaxPayable,
    canCarryForward: unrelievedForeignTax > 0,
    deductionAlternative,
    explanation: `Resident taxpayer — eligible for foreign tax relief. Average TZ rate: ${(averageTanzaniaRate * 100).toFixed(2)}%. Credit limit: TZS ${creditLimit.toLocaleString()} (lower of foreign tax paid TZS ${input.foreignTaxPaid.toLocaleString()} vs rate×income TZS ${creditByRate.toLocaleString()}). Tax saving: TZS ${taxSaving.toLocaleString()}. Final tax payable: TZS ${finalTaxPayable.toLocaleString()}.${unrelievedForeignTax > 0 ? ` Unrelieved TZS ${unrelievedForeignTax.toLocaleString()} can be carried forward.` : ''}`,
    breakdown,
  };
}
