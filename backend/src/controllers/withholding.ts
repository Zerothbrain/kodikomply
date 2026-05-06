import prisma from '../lib/prisma';

export interface WHTInput {
  paymentType: string;
  recipientType: 'RESIDENT' | 'NON_RESIDENT';
  grossAmount: number;
  vatAmount?: number;
  isRent?: boolean;
  totalRentAnnual?: number;
  isPartnership?: boolean;
  partnerShares?: number[];
  isConstruction?: boolean;
  materialsAmount?: number;
  servicesAmount?: number;
}

export interface WHTResult {
  whtBase: number;
  rate: number;
  whtAmount: number;
  isFinal: boolean;
  partnerAllocations?: Array<{ share: number; wht: number }>;
  breakdown: Array<{ description: string; amount: number }>;
  explanation: string;
}

async function getWHTRate(paymentType: string, recipientType: string): Promise<{ rate: number; isFinal: boolean } | null> {
  const rule = await prisma.withholdingRate.findFirst({
    where: {
      paymentType: { contains: paymentType },
      recipientType: recipientType as 'RESIDENT' | 'NON_RESIDENT',
      isActive: true,
    },
  });
  if (!rule) return null;
  return { rate: Number(rule.rate), isFinal: rule.isFinal };
}

export async function calculateWithholding(input: WHTInput): Promise<WHTResult> {
  const breakdown: Array<{ description: string; amount: number }> = [];

  // WHT is exclusive of VAT
  const whtBase = Math.max(0, input.grossAmount - (input.vatAmount ?? 0));
  breakdown.push({ description: 'Payment amount (gross)', amount: input.grossAmount });
  if (input.vatAmount && input.vatAmount > 0) {
    breakdown.push({ description: 'Less: VAT component', amount: -input.vatAmount });
  }
  breakdown.push({ description: 'WHT base (exclusive of VAT)', amount: whtBase });

  // Rent exemption: total annual rent ≤ 500,000 and not in business
  if (input.isRent && (input.totalRentAnnual ?? input.grossAmount) <= 500_000) {
    return {
      whtBase, rate: 0, whtAmount: 0, isFinal: false,
      breakdown: [...breakdown, { description: 'WHT — EXEMPT (rent ≤ TZS 500,000)', amount: 0 }],
      explanation: 'Rent exemption applies: total annual rent does not exceed TZS 500,000.',
    };
  }

  // Construction WHT split
  if (input.isConstruction) {
    let matAmount: number, svcAmount: number;
    if (input.materialsAmount !== undefined && input.servicesAmount !== undefined) {
      matAmount = input.materialsAmount;
      svcAmount = input.servicesAmount;
    } else {
      matAmount = Math.round(whtBase * (3 / 5));
      svcAmount = Math.round(whtBase * (2 / 5));
    }
    const matWHT = Math.round(matAmount * 0.02);
    const svcWHT = Math.round(svcAmount * 0.05);
    const totalWHT = matWHT + svcWHT;
    breakdown.push({ description: `Materials (3/5 × 2%) = ${matAmount.toLocaleString()} × 2%`, amount: matWHT });
    breakdown.push({ description: `Services (2/5 × 5%) = ${svcAmount.toLocaleString()} × 5%`, amount: svcWHT });
    breakdown.push({ description: 'Total construction WHT', amount: totalWHT });
    return {
      whtBase, rate: 0, whtAmount: totalWHT, isFinal: false,
      breakdown,
      explanation: `Construction WHT split: materials ${matAmount.toLocaleString()} @ 2% = ${matWHT.toLocaleString()}; services ${svcAmount.toLocaleString()} @ 5% = ${svcWHT.toLocaleString()}. Total WHT: TZS ${totalWHT.toLocaleString()}.`,
    };
  }

  const rateData = await getWHTRate(input.paymentType, input.recipientType);
  if (!rateData) {
    return {
      whtBase, rate: 0, whtAmount: 0, isFinal: false,
      breakdown: [...breakdown, { description: 'WHT rate not found', amount: 0 }],
      explanation: `No WHT rate configured for ${input.paymentType} (${input.recipientType}).`,
    };
  }

  const whtAmount = Math.round(whtBase * rateData.rate);
  breakdown.push({ description: `WHT @ ${(rateData.rate * 100).toFixed(0)}% (${rateData.isFinal ? 'FINAL' : 'non-final'})`, amount: whtAmount });

  let partnerAllocations: Array<{ share: number; wht: number }> | undefined;
  if (input.isPartnership && input.partnerShares && input.partnerShares.length > 0) {
    const totalShares = input.partnerShares.reduce((s, p) => s + p, 0);
    partnerAllocations = input.partnerShares.map(share => ({
      share,
      wht: Math.round(whtAmount * (share / totalShares)),
    }));
  }

  return {
    whtBase,
    rate: rateData.rate,
    whtAmount,
    isFinal: rateData.isFinal,
    partnerAllocations,
    breakdown,
    explanation: `WHT base (exclusive of VAT): TZS ${whtBase.toLocaleString()}. Rate: ${(rateData.rate * 100).toFixed(0)}%. WHT: TZS ${whtAmount.toLocaleString()} (${rateData.isFinal ? 'FINAL — no further tax due on this income' : 'non-final — offset against annual tax liability'}).`,
  };
}
