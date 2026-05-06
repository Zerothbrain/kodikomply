// ── LONG-TERM CONTRACTS (S.26 ITA) ────────────────────────────────────────────
// Applies to: construction, installation, manufacturing contracts > 1 year
// Method: percentage of completion (accrual basis only)

export interface LongTermContractInput {
  contractName: string;
  totalContractValue: number;
  estimatedTotalExpenditure: number;
  expenditureIncurredToDate: number;
  currentYearExpenditure: number;
  contractStartYear: number;
  currentYearOfIncome: number;
  priorYearsIncomeRecognised?: number;
}

export interface LongTermContractResult {
  percentageCompletion: number;
  incomeForYear: number;
  deductionsForYear: number;
  netTaxableAmount: number;
  cumulativeIncomeToDate: number;
  lossCarrybackEligible: boolean;
  explanation: string;
  breakdown: Array<{ description: string; amount: number; notes?: string }>;
  warnings: string[];
}

export function calculateLongTermContract(input: LongTermContractInput): LongTermContractResult {
  const warnings: string[] = [];

  if (input.estimatedTotalExpenditure <= 0) {
    throw new Error('Estimated total expenditure must be greater than zero.');
  }

  // Check if contract qualifies (> 1 year, not likely to complete within 6 months)
  const yearsRunning = input.currentYearOfIncome - input.contractStartYear + 1;
  if (yearsRunning <= 1) {
    warnings.push('Contract started in the current year — if expected to complete within 6 months of start, this method does NOT apply. Normal income recognition rules apply.');
  }

  // % completion = expenditure to date ÷ estimated total expenditure × 100
  const percentageCompletion = Math.min(100, (input.expenditureIncurredToDate / input.estimatedTotalExpenditure) * 100);

  // Income for year = (total contract value × % completion) − prior years' recognised income
  const cumulativeIncomeToDate = input.totalContractValue * (percentageCompletion / 100);
  const priorYears = input.priorYearsIncomeRecognised ?? 0;
  const incomeForYear = Math.max(0, cumulativeIncomeToDate - priorYears);

  // Deductions = expenditure incurred THIS year
  const deductionsForYear = input.currentYearExpenditure;

  const netTaxableAmount = incomeForYear - deductionsForYear;
  const lossCarrybackEligible = netTaxableAmount < 0;

  if (percentageCompletion >= 95) {
    warnings.push('Contract is near completion (≥95%). Verify all remaining income has been recognised.');
  }

  const breakdown: Array<{ description: string; amount: number; notes?: string }> = [
    { description: 'Total contract value', amount: input.totalContractValue },
    { description: 'Estimated total expenditure', amount: input.estimatedTotalExpenditure },
    { description: 'Expenditure incurred to date', amount: input.expenditureIncurredToDate },
    { description: `% completion (${percentageCompletion.toFixed(2)}%)`, amount: 0, notes: 'expenditure to date ÷ estimated total × 100' },
    { description: 'Cumulative income to date (contract value × % completion)', amount: cumulativeIncomeToDate },
    { description: 'Less: prior years income recognised', amount: -priorYears },
    { description: 'INCOME FOR CURRENT YEAR', amount: incomeForYear },
    { description: 'DEDUCTIONS (current year expenditure)', amount: -deductionsForYear },
    { description: `NET TAXABLE AMOUNT`, amount: netTaxableAmount },
  ];

  return {
    percentageCompletion,
    incomeForYear,
    deductionsForYear,
    netTaxableAmount,
    cumulativeIncomeToDate,
    lossCarrybackEligible,
    breakdown,
    warnings,
    explanation: `Contract: "${input.contractName}". Expenditure to date TZS ${input.expenditureIncurredToDate.toLocaleString()} ÷ estimated total TZS ${input.estimatedTotalExpenditure.toLocaleString()} = ${percentageCompletion.toFixed(2)}% complete. Income this year: TZS ${incomeForYear.toLocaleString()}. Deductions: TZS ${deductionsForYear.toLocaleString()}. Net: TZS ${netTaxableAmount.toLocaleString()}.${lossCarrybackEligible ? ' Loss may be carried back to prior years under Commissioner approval.' : ''}`,
  };
}
