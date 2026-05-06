import prisma from '../lib/prisma';

export interface PenaltyInput {
  taxpayerType: 'individual' | 'corporate';
  taxType: 'income_tax' | 'vat' | 'wht' | 'paye' | 'other';
  assessableTax: number;
  monthsDelayed: number;
  isWHT?: boolean;
  principalTax?: number;
  monthsOverdue?: number;
  failureToRegisterVAT?: boolean;
  isKnowingOrReckless?: boolean;
}

export interface PenaltyResult {
  lateFilingPenalty: number;
  additionalFineMin: number;
  additionalFineMax: number;
  latePaymentInterest: number;
  totalLiability: number;
  currencyPointValue: number;
  breakdown: Array<{ description: string; amount: number }>;
  explanation: string;
  registrationPenalty?: { minFine: number; maxFine: number; imprisonmentNote?: string };
}

async function getCurrencyPoint(): Promise<number> {
  const rule = await prisma.taxRule.findFirst({ where: { category: 'CURRENCY_POINT', isActive: true } });
  return Number(rule?.fixedAmount ?? 15_000);
}

async function getStatutoryRate(): Promise<number> {
  const rule = await prisma.taxRule.findFirst({ where: { category: 'INTEREST_RATE', isActive: true } });
  return Number(rule?.rate ?? 0.12);
}

export async function calculatePenalties(input: PenaltyInput): Promise<PenaltyResult> {
  const currencyPoint = await getCurrencyPoint();
  const statutoryRate = await getStatutoryRate();
  const breakdown: Array<{ description: string; amount: number }> = [];
  const months = input.monthsDelayed;

  // ── Failure to register for VAT ──────────────────────────────────────────
  if (input.failureToRegisterVAT) {
    const isKnowing = input.isKnowingOrReckless ?? false;
    const minMultiplier = isKnowing ? 100 : 50;
    const maxMultiplier = isKnowing ? 200 : 100;
    const minFine = currencyPoint * minMultiplier;
    const maxFine = currencyPoint * maxMultiplier;
    breakdown.push({ description: `Failure to register VAT — fine range: ${minMultiplier}–${maxMultiplier} currency points`, amount: minFine });

    return {
      lateFilingPenalty: 0,
      additionalFineMin: minFine,
      additionalFineMax: maxFine,
      latePaymentInterest: 0,
      totalLiability: minFine,
      currencyPointValue: currencyPoint,
      breakdown,
      explanation: `Failure to register for VAT. Fine: ${minMultiplier}–${maxMultiplier} currency points = TZS ${minFine.toLocaleString()}–${maxFine.toLocaleString()}.${isKnowing ? ' Knowing/reckless failure: 1–2 years imprisonment also possible.' : ' Other cases: 1–3 months imprisonment also possible.'}`,
      registrationPenalty: {
        minFine,
        maxFine,
        imprisonmentNote: isKnowing ? '1–2 years imprisonment (knowing/reckless failure)' : '1–3 months imprisonment (other cases)',
      },
    };
  }

  // ── WHT late filing ───────────────────────────────────────────────────────
  if (input.isWHT || input.taxType === 'wht') {
    const percentagePenalty = Math.round(input.assessableTax * 0.025);
    const fixedMin = input.taxpayerType === 'corporate' ? 225_000 : 75_000;
    const whtPenalty = Math.max(percentagePenalty, fixedMin);
    breakdown.push({ description: `WHT late filing: 2.5% of assessable = ${percentagePenalty.toLocaleString()}`, amount: percentagePenalty });
    breakdown.push({ description: `WHT fixed minimum (${input.taxpayerType}): ${fixedMin.toLocaleString()}`, amount: fixedMin });
    breakdown.push({ description: 'WHT late filing penalty (higher of above)', amount: whtPenalty });

    const P = (input.principalTax ?? input.assessableTax) + whtPenalty;
    const t = input.monthsOverdue ?? months;
    const latePaymentInterest = t > 0 ? Math.round(P * (Math.pow(1 + statutoryRate / 12, t) - 1)) : 0;
    if (latePaymentInterest > 0) {
      breakdown.push({ description: `Late payment compound interest (${(statutoryRate * 100).toFixed(0)}% p.a., ${t} months)`, amount: latePaymentInterest });
    }
    const totalLiability = input.assessableTax + whtPenalty + latePaymentInterest;
    breakdown.push({ description: 'TOTAL LIABILITY', amount: totalLiability });

    return {
      lateFilingPenalty: whtPenalty,
      additionalFineMin: 0,
      additionalFineMax: 0,
      latePaymentInterest,
      totalLiability,
      currencyPointValue: currencyPoint,
      breakdown,
      explanation: `WHT late filing penalty: higher of 2.5% (TZS ${percentagePenalty.toLocaleString()}) or fixed minimum TZS ${fixedMin.toLocaleString()} = TZS ${whtPenalty.toLocaleString()}. Interest: TZS ${latePaymentInterest.toLocaleString()}. Total: TZS ${totalLiability.toLocaleString()}.`,
    };
  }

  // ── VAT late filing (S.78 TAA) ────────────────────────────────────────────
  if (input.taxType === 'vat') {
    const vatPercentagePenalty = Math.round(0.025 * input.assessableTax * 2 * months);
    const vatCPPerMonth = input.taxpayerType === 'corporate' ? 15 : 5;
    const vatCPPenalty = Math.round(currencyPoint * vatCPPerMonth * 2 * months);
    const vatFilingPenalty = Math.max(vatPercentagePenalty, vatCPPenalty);

    breakdown.push({ description: `VAT late filing — 2.5% × tax × 2 × ${months} months`, amount: vatPercentagePenalty });
    breakdown.push({ description: `VAT late filing — ${vatCPPerMonth}cp × ${currencyPoint.toLocaleString()} × 2 × ${months} months`, amount: vatCPPenalty });
    breakdown.push({ description: 'VAT late filing penalty (higher of above)', amount: vatFilingPenalty });

    // Additional fine: 50–100 currency points
    const additionalFineMin = currencyPoint * 50;
    const additionalFineMax = currencyPoint * 100;
    breakdown.push({ description: 'Additional fine range (50–100 currency points)', amount: additionalFineMin });

    const P = (input.principalTax ?? input.assessableTax) + vatFilingPenalty;
    const t = input.monthsOverdue ?? months;
    const latePaymentInterest = t > 0 ? Math.round(P * (Math.pow(1 + statutoryRate / 12, t) - 1)) : 0;
    if (latePaymentInterest > 0) {
      breakdown.push({ description: `Late payment interest: P(${P.toLocaleString()}) × [(1 + ${(statutoryRate * 100).toFixed(0)}%/12)^${t} − 1]`, amount: latePaymentInterest });
    }

    const totalLiability = input.assessableTax + vatFilingPenalty + latePaymentInterest;
    breakdown.push({ description: 'TOTAL LIABILITY', amount: totalLiability });

    return {
      lateFilingPenalty: vatFilingPenalty,
      additionalFineMin,
      additionalFineMax,
      latePaymentInterest,
      totalLiability,
      currencyPointValue: currencyPoint,
      breakdown,
      explanation: `VAT late filing (S.78 TAA). Penalty: higher of ${vatPercentagePenalty.toLocaleString()} (2.5% method) or ${vatCPPenalty.toLocaleString()} (currency points) = TZS ${vatFilingPenalty.toLocaleString()}. Additional fine: TZS ${additionalFineMin.toLocaleString()}–${additionalFineMax.toLocaleString()}. Compound interest: TZS ${latePaymentInterest.toLocaleString()}. Total: TZS ${totalLiability.toLocaleString()}.`,
    };
  }

  // ── Standard late filing (income tax / PAYE / other) ─────────────────────
  const percentageBased = Math.round(0.025 * input.assessableTax * 2 * months);
  const currencyPointsPerMonth = input.taxpayerType === 'corporate' ? 15 : 5;
  const currencyPointBased = Math.round(currencyPoint * currencyPointsPerMonth * 2 * months);
  const lateFilingPenalty = Math.max(percentageBased, currencyPointBased);

  breakdown.push({ description: `Late filing — 2.5% × tax × 2 × ${months} months`, amount: percentageBased });
  breakdown.push({ description: `Late filing — ${currencyPointsPerMonth}cp × ${currencyPoint.toLocaleString()} × 2 × ${months} months`, amount: currencyPointBased });
  breakdown.push({ description: 'Late filing penalty (higher of above)', amount: lateFilingPenalty });

  const additionalFineMin = currencyPoint * 50;
  const additionalFineMax = currencyPoint * 100;
  breakdown.push({ description: 'Additional fine range: 50–100 currency points', amount: additionalFineMin });

  // Late payment compound interest: I = P[(1+r/12)^t - 1]
  const P = (input.principalTax ?? input.assessableTax) + lateFilingPenalty;
  const t = input.monthsOverdue ?? months;
  const r = statutoryRate;
  const latePaymentInterest = t > 0 ? Math.round(P * (Math.pow(1 + r / 12, t) - 1)) : 0;
  breakdown.push({ description: `Late payment interest: P(${P.toLocaleString()}) × [(1 + ${(r * 100).toFixed(0)}%/12)^${t} − 1]`, amount: latePaymentInterest });

  const totalLiability = input.assessableTax + lateFilingPenalty + latePaymentInterest;
  breakdown.push({ description: 'TOTAL LIABILITY', amount: totalLiability });

  return {
    lateFilingPenalty,
    additionalFineMin,
    additionalFineMax,
    latePaymentInterest,
    totalLiability,
    currencyPointValue: currencyPoint,
    breakdown,
    explanation: `Late filing (${months} month(s)). Penalty: TZS ${lateFilingPenalty.toLocaleString()}. Additional fine: TZS ${additionalFineMin.toLocaleString()}–${additionalFineMax.toLocaleString()}. Compound interest: TZS ${latePaymentInterest.toLocaleString()} at ${(r * 100).toFixed(0)}% p.a. Total: TZS ${totalLiability.toLocaleString()}.`,
  };
}
