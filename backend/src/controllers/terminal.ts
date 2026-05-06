export interface TerminalInput {
  paymentAmount: number;
  contractType: 'specified' | 'unspecified_with_clause' | 'unspecified_without_clause' | 'general';
  yearsOfService?: number;
  unexpiredYears?: number;
  priorYearSalary?: number;
  payeeBands: Array<{ min: number; max: number | null; rate: number }>;
}

export interface TerminalResult {
  totalPayment: number;
  taxableAmount: number;
  nonTaxableAmount: number;
  yearlyAllocations: Array<{ year: string; amount: number; tax: number }>;
  totalTax: number;
  netPayment: number;
  explanation: string;
}

function calculateTaxOnAmount(
  amount: number,
  bands: Array<{ min: number; max: number | null; rate: number }>
): number {
  // Convert annual amount to monthly equivalent, tax it, then annualise
  const monthly = amount / 12;
  let tax = 0;
  for (const band of bands) {
    if (monthly <= band.min) break;
    const upper = band.max ?? Infinity;
    const portion = Math.min(monthly, upper) - band.min;
    tax += portion * band.rate;
  }
  return Math.round(tax * 12);
}

export function calculateTerminalBenefits(input: TerminalInput): TerminalResult {
  const { paymentAmount, contractType, unexpiredYears, priorYearSalary, payeeBands } = input;

  if (contractType === 'general') {
    // CASE 1: Payment relates to 5+ years ago — spread over 6 years
    const perYear = paymentAmount / 6;
    const yearlyAllocations = Array.from({ length: 6 }, (_, i) => {
      const year = i === 0 ? 'Current year' : `${i} year(s) ago`;
      const tax = calculateTaxOnAmount(perYear, payeeBands);
      return { year, amount: Math.round(perYear), tax };
    });
    const totalTax = yearlyAllocations.reduce((s, y) => s + y.tax, 0);
    return {
      totalPayment: paymentAmount,
      taxableAmount: paymentAmount,
      nonTaxableAmount: 0,
      yearlyAllocations,
      totalTax,
      netPayment: paymentAmount - totalTax,
      explanation: `General termination: payment spread equally over 6 years (TZS ${Math.round(perYear).toLocaleString()} per year). Each year's portion taxed at applicable PAYE rates.`,
    };
  }

  if (contractType === 'specified') {
    // CASE 2: Specified term — cap at unexpired period, spread evenly
    const years = unexpiredYears ?? 1;
    const perYear = paymentAmount / years;
    const yearlyAllocations = Array.from({ length: years }, (_, i) => {
      const tax = calculateTaxOnAmount(perYear, payeeBands);
      return { year: `Year ${i + 1} (unexpired)`, amount: Math.round(perYear), tax };
    });
    const totalTax = yearlyAllocations.reduce((s, y) => s + y.tax, 0);
    return {
      totalPayment: paymentAmount,
      taxableAmount: paymentAmount,
      nonTaxableAmount: 0,
      yearlyAllocations,
      totalTax,
      netPayment: paymentAmount - totalTax,
      explanation: `Specified term contract: compensation capped and spread over ${years} unexpired year(s) at TZS ${Math.round(perYear).toLocaleString()} per year.`,
    };
  }

  if (contractType === 'unspecified_with_clause') {
    // CASE 3: Unspecified term WITH clause — spread forward at prior year rate, no cap
    const annualRate = priorYearSalary ?? 0;
    if (annualRate <= 0) {
      return {
        totalPayment: paymentAmount, taxableAmount: paymentAmount, nonTaxableAmount: 0,
        yearlyAllocations: [], totalTax: 0, netPayment: paymentAmount,
        explanation: 'Prior year salary required for unspecified term calculation.',
      };
    }
    const yearsToExhaust = Math.ceil(paymentAmount / annualRate);
    const yearlyAllocations = [];
    let remaining = paymentAmount;
    for (let i = 0; i < yearsToExhaust; i++) {
      const amount = Math.min(remaining, annualRate);
      const tax = calculateTaxOnAmount(amount, payeeBands);
      yearlyAllocations.push({ year: `Future Year ${i + 1}`, amount: Math.round(amount), tax });
      remaining -= amount;
    }
    const totalTax = yearlyAllocations.reduce((s, y) => s + y.tax, 0);
    return {
      totalPayment: paymentAmount,
      taxableAmount: paymentAmount,
      nonTaxableAmount: 0,
      yearlyAllocations,
      totalTax,
      netPayment: paymentAmount - totalTax,
      explanation: `Unspecified term with compensation clause: no cap. Payment spread forward at TZS ${annualRate.toLocaleString()} per year until exhausted (${yearsToExhaust} year(s)).`,
    };
  }

  // CASE 4: Unspecified term WITHOUT clause — 3-year salary cap
  const annualRate = priorYearSalary ?? 0;
  const cap = annualRate * 3;
  const taxableAmount = Math.min(paymentAmount, cap);
  const nonTaxableAmount = paymentAmount - taxableAmount;
  const yearsToExhaust = annualRate > 0 ? Math.ceil(taxableAmount / annualRate) : 1;
  const yearlyAllocations = [];
  let remaining = taxableAmount;
  for (let i = 0; i < yearsToExhaust; i++) {
    const amount = Math.min(remaining, annualRate > 0 ? annualRate : taxableAmount);
    const tax = calculateTaxOnAmount(amount, payeeBands);
    yearlyAllocations.push({ year: `Future Year ${i + 1}`, amount: Math.round(amount), tax });
    remaining -= amount;
  }
  const totalTax = yearlyAllocations.reduce((s, y) => s + y.tax, 0);
  return {
    totalPayment: paymentAmount,
    taxableAmount,
    nonTaxableAmount,
    yearlyAllocations,
    totalTax,
    netPayment: paymentAmount - totalTax,
    explanation: `Unspecified term without compensation clause: taxable portion capped at 3 years' remuneration (TZS ${cap.toLocaleString()}). Balance of TZS ${nonTaxableAmount.toLocaleString()} is NOT taxable.`,
  };
}
