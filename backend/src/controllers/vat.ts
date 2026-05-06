import prisma from '../lib/prisma';

export interface VATInput {
  annualTurnover: number;
  sixMonthTurnover?: number;
  isLicensedProfessional?: boolean;
  taxableSales: number;
  exemptSales: number;
  taxablePurchases: number;
  exemptPurchases: number;
  mixedPurchases?: number;
  importedGoods?: number;
  importDuty?: number;
  exciseDuty?: number;
  otherLevies?: number;
  importedServices?: number;
  isRegistered?: boolean;
}

export interface VATResult {
  mustRegister: boolean;
  registrationReason?: string;
  outputTax: number;
  inputTaxDirect: number;
  inputTaxApportioned: number;
  inputTaxTotal: number;
  importVAT: number;
  reverseChargeOutput: number;
  reverseChargeInput: number;
  netVAT: number;
  apportionmentRatio: number;
  apportionmentCategory: string;
  breakdown: Array<{ description: string; amount: number }>;
  explanation: string;
}

async function getVATRate(): Promise<number> {
  const rule = await prisma.taxRule.findFirst({ where: { category: 'VAT', name: 'Standard Rate', isActive: true } });
  return Number(rule?.rate ?? 0.18);
}

async function getVATThreshold(): Promise<{ annual: number; sixMonth: number }> {
  const annual = await prisma.taxRule.findFirst({ where: { category: 'VAT', name: 'Registration Threshold Annual', isActive: true } });
  const sixMonth = await prisma.taxRule.findFirst({ where: { category: 'VAT', name: 'Registration Threshold 6 Month', isActive: true } });
  return {
    annual: Number(annual?.fixedAmount ?? 200_000_000),
    sixMonth: Number(sixMonth?.fixedAmount ?? 100_000_000),
  };
}

export async function calculateVAT(input: VATInput): Promise<VATResult> {
  const vatRate = await getVATRate();
  const thresholds = await getVATThreshold();
  const breakdown: Array<{ description: string; amount: number }> = [];

  // Registration check
  let mustRegister = false;
  let registrationReason = '';
  if (input.isLicensedProfessional) {
    mustRegister = true;
    registrationReason = 'Licensed professional must register regardless of turnover';
  } else if (input.annualTurnover >= thresholds.annual) {
    mustRegister = true;
    registrationReason = `Annual turnover TZS ${input.annualTurnover.toLocaleString()} exceeds threshold of TZS ${thresholds.annual.toLocaleString()}`;
  } else if ((input.sixMonthTurnover ?? 0) >= thresholds.sixMonth) {
    mustRegister = true;
    registrationReason = `Six-month turnover TZS ${(input.sixMonthTurnover ?? 0).toLocaleString()} exceeds threshold of TZS ${thresholds.sixMonth.toLocaleString()}`;
  }

  // Output tax
  const outputTax = Math.round(input.taxableSales * vatRate);
  breakdown.push({ description: `Output VAT (${input.taxableSales.toLocaleString()} × ${(vatRate * 100).toFixed(0)}%)`, amount: outputTax });

  // Input tax apportionment
  const T = input.taxableSales;
  const A = input.taxableSales + input.exemptSales;
  const ratio = A > 0 ? T / A : 0;

  let apportionmentCategory = '';
  let inputTaxDirect = Math.round(input.taxablePurchases * vatRate);
  let inputTaxApportioned = 0;

  if (ratio >= 0.90) {
    apportionmentCategory = 'Full recovery (T/A ≥ 90%)';
    inputTaxApportioned = Math.round((input.mixedPurchases ?? 0) * vatRate);
  } else if (ratio < 0.10) {
    apportionmentCategory = 'No recovery (T/A < 10%)';
    inputTaxApportioned = 0;
  } else {
    apportionmentCategory = `Partial recovery (T/A = ${(ratio * 100).toFixed(1)}%)`;
    inputTaxApportioned = Math.round((input.mixedPurchases ?? 0) * vatRate * ratio);
  }

  breakdown.push({ description: `Input VAT — direct taxable purchases`, amount: -inputTaxDirect });
  if (input.mixedPurchases && input.mixedPurchases > 0) {
    breakdown.push({ description: `Input VAT — apportioned mixed purchases (${apportionmentCategory})`, amount: -inputTaxApportioned });
  }

  // Import VAT
  const cifValue = input.importedGoods ?? 0;
  const importBase = cifValue + (input.importDuty ?? 0) + (input.exciseDuty ?? 0) + (input.otherLevies ?? 0);
  const importVAT = Math.round(importBase * vatRate);
  if (importVAT > 0) breakdown.push({ description: `Import VAT (CIF + duties × ${(vatRate * 100).toFixed(0)}%)`, amount: -importVAT });

  // Reverse charge on imported services
  const importedServices = input.importedServices ?? 0;
  const reverseChargeOutput = Math.round(importedServices * vatRate);
  const reverseChargeInput = reverseChargeOutput; // claim back in same return
  if (reverseChargeOutput > 0) {
    breakdown.push({ description: 'Reverse charge — imported services (output)', amount: reverseChargeOutput });
    breakdown.push({ description: 'Reverse charge — imported services (input, same return)', amount: -reverseChargeInput });
  }

  const inputTaxTotal = inputTaxDirect + inputTaxApportioned + importVAT + reverseChargeInput;
  const netVAT = outputTax + reverseChargeOutput - inputTaxTotal;

  breakdown.push({ description: 'NET VAT (payable) / refundable', amount: netVAT });

  return {
    mustRegister,
    registrationReason,
    outputTax,
    inputTaxDirect,
    inputTaxApportioned,
    inputTaxTotal,
    importVAT,
    reverseChargeOutput,
    reverseChargeInput,
    netVAT,
    apportionmentRatio: Math.round(ratio * 10000) / 100,
    apportionmentCategory,
    breakdown,
    explanation: `${mustRegister ? `VAT registration required: ${registrationReason}. ` : ''}Output VAT: TZS ${outputTax.toLocaleString()}. Input VAT: TZS ${inputTaxTotal.toLocaleString()}. Net VAT ${netVAT >= 0 ? 'payable' : 'refundable'}: TZS ${Math.abs(netVAT).toLocaleString()}. Apportionment ratio T/A = ${(ratio * 100).toFixed(1)}% (${apportionmentCategory}).`,
  };
}
