import prisma from '../lib/prisma';

export interface InvestmentInput {
  dividends?: { amount: number; fromResidentCorp: boolean; isDSEListed?: boolean };
  interest?: number;
  rent?: number;
  royalties?: number;
  lifeInsuranceProceeds?: number;
  lifeInsurancePremiumsPaid?: number;
  lifeInsuranceFromResidentInsurer?: boolean;
  assetGains?: Array<{
    description: string;
    proceedsAmount: number;
    costBase: number;
    isPrivateResidence?: boolean;
    yearsOwned?: number;
    yearsLivedIn?: number;
    isAgriculturalLand?: boolean;
    marketValueOfLand?: number;
    isDSEShares?: boolean;
    ownershipPercentage?: number;
    isSharesOrSecurities?: boolean;
  }>;
  // Capital gains special rate (First Schedule Para 1(2))
  totalAnnualIncome?: number;
  commutedPensionAmount?: number;
}

export interface InvestmentResult {
  totalIncome: number;
  taxableIncome: number;
  exemptIncome: number;
  finalWHTIncome: number;
  capitalGainsTax: number;
  regularTax: number;
  totalTaxEstimate: number;
  capitalGainsFlat10Applies: boolean;
  breakdown: Array<{ description: string; amount: number; taxable: boolean; reason: string }>;
  explanation: string;
}

export async function calculateInvestment(input: InvestmentInput): Promise<InvestmentResult> {
  const breakdown: Array<{ description: string; amount: number; taxable: boolean; reason: string }> = [];

  // Load capital gains threshold from DB
  const cgRule = await prisma.taxRule.findFirst({ where: { category: 'CAPITAL_GAINS', isActive: true } });
  const cgThreshold = Number(cgRule?.fixedAmount ?? 3_240_000);
  const cgFlatRate = Number(cgRule?.rate ?? 0.10);

  // Dividends
  if (input.dividends && input.dividends.amount > 0) {
    if (input.dividends.fromResidentCorp) {
      breakdown.push({
        description: `Dividends (${input.dividends.isDSEListed ? 'DSE-listed — 5%' : 'non-DSE — 10%'} final WHT)`,
        amount: input.dividends.amount,
        taxable: false,
        reason: 'Subject to final WHT at source — not included in individual income',
      });
    } else {
      breakdown.push({
        description: 'Dividends from non-resident corporation',
        amount: input.dividends.amount,
        taxable: true,
        reason: 'Include in income — not subject to final WHT in Tanzania',
      });
    }
  }

  // Interest
  if (input.interest && input.interest > 0) {
    breakdown.push({ description: 'Interest income', amount: input.interest, taxable: true, reason: 'Investment income — taxable' });
  }

  // Rent
  if (input.rent && input.rent > 0) {
    breakdown.push({ description: 'Rental income', amount: input.rent, taxable: true, reason: 'Investment income — 10% final WHT applies if paid by a withholder' });
  }

  // Royalties
  if (input.royalties && input.royalties > 0) {
    breakdown.push({ description: 'Royalties', amount: input.royalties, taxable: true, reason: 'Investment income — 10% final WHT applies' });
  }

  // Life insurance
  if (input.lifeInsuranceProceeds && input.lifeInsuranceProceeds > 0) {
    const gain = Math.max(0, input.lifeInsuranceProceeds - (input.lifeInsurancePremiumsPaid ?? 0));
    if (input.lifeInsuranceFromResidentInsurer) {
      breakdown.push({ description: 'Life insurance gain (resident insurer)', amount: gain, taxable: false, reason: 'Exempt — proceeds from resident insurer life policy' });
    } else {
      breakdown.push({ description: 'Life insurance gain (non-resident insurer)', amount: gain, taxable: true, reason: 'Taxable — non-resident insurer' });
    }
  }

  // Commuted pension — 10% final WHT (First Schedule Para 1(2))
  let commutedPensionForCapGains = 0;
  if (input.commutedPensionAmount && input.commutedPensionAmount > 0) {
    commutedPensionForCapGains = input.commutedPensionAmount;
    breakdown.push({
      description: 'Commuted pension',
      amount: input.commutedPensionAmount,
      taxable: false,
      reason: 'Subject to 10% final WHT — treated as capital gain for rate purposes if total income > threshold',
    });
  }

  // Asset gains — capital gains
  let netSharesGains = 0;
  for (const asset of (input.assetGains ?? [])) {
    const gain = asset.proceedsAmount - asset.costBase;
    if (gain <= 0) continue;

    if (asset.isPrivateResidence && (asset.yearsOwned ?? 0) >= 3 && (asset.yearsLivedIn ?? 0) >= 3 && gain <= 15_000_000) {
      breakdown.push({ description: `${asset.description} — private residence gain`, amount: gain, taxable: false, reason: 'Exempt: owned and lived in 3+ years, gain ≤ TZS 15,000,000' });
      continue;
    }

    if (asset.isAgriculturalLand && (asset.marketValueOfLand ?? Infinity) < 10_000_000) {
      breakdown.push({ description: `${asset.description} — agricultural land gain`, amount: gain, taxable: false, reason: 'Exempt: market value < TZS 10,000,000' });
      continue;
    }

    if (asset.isDSEShares && (asset.ownershipPercentage ?? 0) < 25) {
      breakdown.push({ description: `${asset.description} — DSE shares gain`, amount: gain, taxable: false, reason: 'Exempt: DSE-listed, ownership < 25%' });
      continue;
    }

    if (asset.isSharesOrSecurities || asset.isDSEShares) {
      netSharesGains += gain;
    }

    breakdown.push({ description: `${asset.description} — capital gain`, amount: gain, taxable: true, reason: 'Net gain on asset realisation — taxable' });
  }

  const taxableItems = breakdown.filter(b => b.taxable);
  const exemptItems = breakdown.filter(b => !b.taxable);
  const finalWHTItems = breakdown.filter(b => b.reason.includes('final WHT'));

  const taxableIncome = taxableItems.reduce((s, i) => s + i.amount, 0);
  const exemptIncome = exemptItems.reduce((s, i) => s + i.amount, 0);
  const finalWHTIncome = finalWHTItems.reduce((s, i) => s + i.amount, 0);
  const totalIncome = breakdown.reduce((s, i) => s + i.amount, 0);

  // ── Capital Gains Special Rate (First Schedule Para 1(2) and 1(3)) ─────────
  // If total income > TZS 3,240,000 AND includes gains from shares/securities
  // or commuted pension → those gains taxed at flat 10%
  const totalIncomeForThreshold = (input.totalAnnualIncome ?? 0) + taxableIncome;
  const capitalGainsFlat10Applies = totalIncomeForThreshold > cgThreshold && (netSharesGains > 0 || commutedPensionForCapGains > 0);

  let capitalGainsTax = 0;
  let regularTax = 0;

  if (capitalGainsFlat10Applies) {
    const gainsForFlat = netSharesGains + commutedPensionForCapGains;
    capitalGainsTax = Math.round(gainsForFlat * cgFlatRate);
    const otherTaxableIncome = taxableIncome - netSharesGains;
    // Progressive tax on remaining income (simplified — actual PAYE bands apply)
    regularTax = 0;
    breakdown.push({
      description: `Capital gains / commuted pension — flat ${(cgFlatRate * 100).toFixed(0)}% rate`,
      amount: capitalGainsTax,
      taxable: true,
      reason: `First Schedule Para 1(2): total income TZS ${totalIncomeForThreshold.toLocaleString()} > threshold TZS ${cgThreshold.toLocaleString()} — flat ${(cgFlatRate * 100).toFixed(0)}% applies`,
    });
    if (otherTaxableIncome > 0) {
      breakdown.push({ description: 'Other investment income (subject to normal progressive rates)', amount: otherTaxableIncome, taxable: true, reason: 'Progressive rates — include in annual income tax return' });
    }
  }

  const totalTaxEstimate = capitalGainsTax + regularTax;

  return {
    totalIncome,
    taxableIncome,
    exemptIncome,
    finalWHTIncome,
    capitalGainsTax,
    regularTax,
    totalTaxEstimate,
    capitalGainsFlat10Applies,
    breakdown,
    explanation: `Total investment income: TZS ${totalIncome.toLocaleString()}. Taxable: TZS ${taxableIncome.toLocaleString()}. Exempt: TZS ${exemptIncome.toLocaleString()}. Final WHT: TZS ${finalWHTIncome.toLocaleString()}.${capitalGainsFlat10Applies ? ` Capital gains flat 10% tax: TZS ${capitalGainsTax.toLocaleString()}.` : ''}`,
  };
}
