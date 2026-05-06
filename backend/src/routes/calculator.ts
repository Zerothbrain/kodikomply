import { Router, Response } from 'express';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import prisma from '../lib/prisma';
import { sendEmail } from '../lib/email';
import { calculateEmployment, EmploymentInput } from '../controllers/employment';
import { calculateBusiness, BusinessInput } from '../controllers/business';
import { calculateVAT, VATInput } from '../controllers/vat';
import { calculateWithholding, WHTInput } from '../controllers/withholding';
import { calculateInvestment, InvestmentInput } from '../controllers/investment';
import { calculateCorporate, CorporateInput } from '../controllers/corporate';
import { calculateTerminalBenefits, TerminalInput } from '../controllers/terminal';
import { calculatePenalties, PenaltyInput } from '../controllers/penalties';
import { calculateVehicleBenefit, calculateResidentialBenefit, calculateLoanBenefit, VehicleBenefitInput, ResidentialBenefitInput, LoanBenefitInput } from '../controllers/benefits';
import { calculatePartnership, PartnershipInput } from '../controllers/partnership';
import { calculateRetirementContribution, calculateRetirementPayment, RetirementContributionInput, RetirementPaymentInput } from '../controllers/retirement';
import { calculateLongTermContract, LongTermContractInput } from '../controllers/longterm';
import { calculateForeignTaxRelief, ForeignTaxReliefInput } from '../controllers/foreigntax';
import { calculatePresumptive, PresumptiveInput } from '../controllers/presumptive';
import { getPAYEBandsPublic } from '../lib/taxHelpers';
import {
  calculateVatBadDebt, BadDebtInput,
  calculateVatRefund, VatRefundInput,
  calculateGoingConcern, GoingConcernInput,
  calculateVatAdjustment, VatAdjustmentInput,
  calculateConnectedPersonsVAT, ConnectedPersonsInput,
  calculateLayBy, LayByInput,
  calculateVatPricing,
  checkFilingRequired, FilingRequiredInput,
  calculateCharitableOrg, CharitableOrgInput,
  calculateClubsAssociations, ClubsInput,
  calculateDigitalMarketplace, DigitalMarketplaceInput,
  calculateThinCap, ThinCapInput,
} from '../controllers/vatExempt';

const router = Router();

const CALC_LABELS: Record<string, string> = {
  employment: 'Employment Tax (PAYE)', business: 'Business Income Tax',
  vat: 'VAT', withholding: 'Withholding Tax (WHT)', investment: 'Investment Income',
  corporate: 'Corporate Tax', terminal_benefits: 'Terminal Benefits',
  penalties: 'Penalties & Interest', partnership: 'Partnership Tax',
  presumptive: 'Presumptive Tax', vehicle_benefit: 'Vehicle Benefit',
  residential_benefit: 'Residential Benefit', loan_benefit: 'Loan Benefit',
  retirement_contribution: 'Retirement Contribution', retirement_payment: 'Retirement Payment',
  long_term_contract: 'Long-Term Contract', foreign_tax_relief: 'Foreign Tax Relief',
  digital_marketplace: 'Digital Marketplace Tax',
};

function buildKeyResultsHtml(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const r = result as Record<string, unknown>;
  const lines: string[] = [];
  const want = ['totalTax', 'taxPayable', 'netTax', 'vatDue', 'whtAmount', 'penaltyAmount',
                'totalPAYE', 'annualTax', 'monthlyTax', 'taxLiability', 'totalAmount', 'amount'];
  for (const k of want) {
    if (r[k] !== undefined) {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      const val   = typeof r[k] === 'number'
        ? `TZS ${(r[k] as number).toLocaleString('en-TZ', { minimumFractionDigits: 0 })}`
        : String(r[k]);
      lines.push(`<p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>${label}:</strong> ${val}</p>`);
    }
  }
  return lines.slice(0, 5).join('') || '<p style="color:#64748b;font-size:13px;">See full details in your dashboard.</p>';
}

function buildKeyResultsText(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const r = result as Record<string, unknown>;
  const lines: string[] = [];
  const want = ['totalTax', 'taxPayable', 'netTax', 'vatDue', 'whtAmount', 'penaltyAmount',
                'totalPAYE', 'annualTax', 'monthlyTax', 'taxLiability', 'totalAmount', 'amount'];
  for (const k of want) {
    if (r[k] !== undefined) {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      const val   = typeof r[k] === 'number'
        ? `TZS ${(r[k] as number).toLocaleString()}`
        : String(r[k]);
      lines.push(`${label}: ${val}`);
    }
  }
  return lines.slice(0, 5).join('\n') || 'See full details in your dashboard.';
}

async function saveCalculation(userId: number | undefined, type: string, input: unknown, result: unknown) {
  try {
    await prisma.calculation.create({
      data: {
        userId: userId ?? null,
        calculationType: type,
        inputData: JSON.stringify(input),
        resultData: JSON.stringify(result),
      },
    });

    // Send summary email to verified users (fire-and-forget)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, isEmailVerified: true },
      });
      if (user?.isEmailVerified) {
        const siteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        sendEmail({
          to:           user.email,
          templateSlug: 'calculation_summary',
          vars: {
            userName:       user.name,
            calculationType: CALC_LABELS[type] || type,
            date:           new Date().toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' }),
            keyResults:     buildKeyResultsHtml(result),
            dashboardUrl:   `${siteUrl}/dashboard`,
            siteUrl,
          },
        }).catch(err => console.error('[calc] Failed to send summary email:', err));
      }
    }
  } catch (e) {
    console.error('Failed to save calculation audit log:', e);
  }
}

// ── EXISTING CALCULATORS ──────────────────────────────────────────────────────

router.post('/employment', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: EmploymentInput = req.body;
    const result = await calculateEmployment(input);
    await saveCalculation(req.user?.id, 'employment', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Employment calculation failed' }); }
});

router.post('/business', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: BusinessInput = req.body;
    const result = await calculateBusiness(input);
    await saveCalculation(req.user?.id, 'business', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Business calculation failed' }); }
});

router.post('/vat', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: VATInput = req.body;
    const result = await calculateVAT(input);
    await saveCalculation(req.user?.id, 'vat', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'VAT calculation failed' }); }
});

router.post('/withholding', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: WHTInput = req.body;
    const result = await calculateWithholding(input);
    await saveCalculation(req.user?.id, 'withholding', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Withholding tax calculation failed' }); }
});

router.post('/investment', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: InvestmentInput = req.body;
    const result = await calculateInvestment(input);
    await saveCalculation(req.user?.id, 'investment', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Investment calculation failed' }); }
});

router.post('/corporate', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: CorporateInput = req.body;
    const result = await calculateCorporate(input);
    await saveCalculation(req.user?.id, 'corporate', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Corporate tax calculation failed' }); }
});

router.post('/terminal-benefits', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bands = await getPAYEBandsPublic();
    const input: TerminalInput = { ...req.body, payeeBands: bands };
    const result = calculateTerminalBenefits(input);
    await saveCalculation(req.user?.id, 'terminal_benefits', req.body, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Terminal benefits calculation failed' }); }
});

router.post('/penalties', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: PenaltyInput = req.body;
    const result = await calculatePenalties(input);
    await saveCalculation(req.user?.id, 'penalties', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Penalty calculation failed' }); }
});

// ── NEW CALCULATORS ───────────────────────────────────────────────────────────

router.post('/vehicle-benefit', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: VehicleBenefitInput = req.body;
    const result = await calculateVehicleBenefit(input);
    await saveCalculation(req.user?.id, 'vehicle_benefit', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Vehicle benefit calculation failed' }); }
});

router.post('/residential-benefit', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: ResidentialBenefitInput = req.body;
    const result = await calculateResidentialBenefit(input);
    await saveCalculation(req.user?.id, 'residential_benefit', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Residential benefit calculation failed' }); }
});

router.post('/loan-benefit', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: LoanBenefitInput = req.body;
    const result = await calculateLoanBenefit(input);
    await saveCalculation(req.user?.id, 'loan_benefit', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Loan benefit calculation failed' }); }
});

router.post('/partnership', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: PartnershipInput = req.body;
    const result = await calculatePartnership(input);
    await saveCalculation(req.user?.id, 'partnership', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: String(err) }); }
});

router.post('/retirement-contribution', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: RetirementContributionInput = req.body;
    const result = await calculateRetirementContribution(input);
    await saveCalculation(req.user?.id, 'retirement_contribution', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Retirement contribution calculation failed' }); }
});

router.post('/retirement-payment', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: RetirementPaymentInput = req.body;
    const result = calculateRetirementPayment(input);
    await saveCalculation(req.user?.id, 'retirement_payment', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Retirement payment calculation failed' }); }
});

router.post('/long-term-contract', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: LongTermContractInput = req.body;
    const result = calculateLongTermContract(input);
    await saveCalculation(req.user?.id, 'long_term_contract', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: String(err) }); }
});

router.post('/foreign-tax-relief', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: ForeignTaxReliefInput = req.body;
    const result = calculateForeignTaxRelief(input);
    await saveCalculation(req.user?.id, 'foreign_tax_relief', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Foreign tax relief calculation failed' }); }
});

// ── LOOKUP ENDPOINTS ──────────────────────────────────────────────────────────

router.get('/paye-bands', async (_req, res: Response): Promise<void> => {
  try {
    const bands = await prisma.taxRule.findMany({ where: { category: 'PAYE_BAND', isActive: true }, orderBy: { minValue: 'asc' } });
    res.json(bands);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch PAYE bands' }); }
});

router.get('/exempt-amounts', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.exemptAmount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch exempt amounts' }); }
});

router.get('/retirement-funds', async (_req, res: Response): Promise<void> => {
  try {
    const funds = await prisma.retirementFund.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(funds);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch retirement funds' }); }
});

router.get('/benefits-in-kind', async (_req, res: Response): Promise<void> => {
  try {
    const benefits = await prisma.benefitInKind.findMany({ where: { isActive: true } });
    res.json(benefits);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch benefits in kind' }); }
});

router.get('/translations/:language', async (req, res: Response): Promise<void> => {
  try {
    const items = await prisma.translation.findMany({ where: { language: req.params.language.toUpperCase() } });
    const map: Record<string, string> = {};
    items.forEach(t => { map[t.key] = t.value; });
    res.json(map);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch translations' }); }
});

// ── VAT EXEMPT ITEMS ──────────────────────────────────────────────────────────
router.get('/vat-exempt-items', async (req, res: Response): Promise<void> => {
  try {
    const { category, search, type } = req.query as Record<string, string>;
    const items = await prisma.vatExemptItem.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
        ...(type ? { exemptionType: type } : {}),
        ...(search ? { OR: [{ itemName: { contains: search } }, { category: { contains: search } }, { hsCode: { contains: search } }] } : {}),
      },
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
    });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch VAT exempt items' }); }
});

router.get('/vat-exempt-imports', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.vatExemptImport.findMany({ where: { isActive: true }, orderBy: { itemNumber: 'asc' } });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch VAT exempt imports' }); }
});

router.get('/vat-categories', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.vatExemptItem.findMany({ where: { isActive: true }, select: { category: true }, distinct: ['category'], orderBy: { category: 'asc' } });
    res.json(items.map(i => i.category));
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/real-estate-vat-rules', async (_req, res: Response): Promise<void> => {
  try {
    const rules = await prisma.realEstateVatRule.findMany({ where: { isActive: true } });
    res.json(rules);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/digital-service-types', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.digitalServiceType.findMany({ where: { isActive: true } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/treaty-countries', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.treatyCountry.findMany({ where: { isActive: true }, orderBy: { countryName: 'asc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/vat-special-settings', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.taxRule.findMany({ where: { category: 'VAT_SPECIAL', isActive: true } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/vehicle-benefit-table', async (_req, res: Response): Promise<void> => {
  try {
    const rows = await prisma.vehicleBenefitTable.findMany({ where: { isActive: true }, orderBy: { engineSizeFrom: 'asc' } });
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ── VAT SPECIAL CALCULATORS ───────────────────────────────────────────────────
router.post('/vat-bad-debt', async (req, res: Response): Promise<void> => {
  try {
    const result = await calculateVatBadDebt(req.body as BadDebtInput);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/vat-refund', async (req, res: Response): Promise<void> => {
  try {
    const result = await calculateVatRefund(req.body as VatRefundInput);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/vat-going-concern', (_req, res: Response): void => {
  try { res.json(calculateGoingConcern(_req.body as GoingConcernInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/vat-adjustment', (_req, res: Response): void => {
  try { res.json(calculateVatAdjustment(_req.body as VatAdjustmentInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/vat-connected-persons', (_req, res: Response): void => {
  try { res.json(calculateConnectedPersonsVAT(_req.body as ConnectedPersonsInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/vat-lay-by', (_req, res: Response): void => {
  try { res.json(calculateLayBy(_req.body as LayByInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/vat-pricing', (req, res: Response): void => {
  const { amount, isInclusive } = req.body;
  res.json(calculateVatPricing(Number(amount), Boolean(isInclusive)));
});

// ── ITA SPECIAL CALCULATORS ───────────────────────────────────────────────────
router.post('/filing-required', (_req, res: Response): void => {
  try { res.json(checkFilingRequired(_req.body as FilingRequiredInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/charitable-org', (_req, res: Response): void => {
  try { res.json(calculateCharitableOrg(_req.body as CharitableOrgInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/clubs-associations', (_req, res: Response): void => {
  try { res.json(calculateClubsAssociations(_req.body as ClubsInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/digital-marketplace', async (req, res: Response): Promise<void> => {
  try {
    const result = await calculateDigitalMarketplace(req.body as DigitalMarketplaceInput);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/thin-cap', (_req, res: Response): void => {
  try { res.json(calculateThinCap(_req.body as ThinCapInput)); }
  catch (err) { res.status(500).json({ error: 'Calculation failed' }); }
});

router.post('/presumptive', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: PresumptiveInput = req.body;
    const result = await calculatePresumptive(input);
    await saveCalculation(req.user?.id, 'presumptive', input, result);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Presumptive tax calculation failed' }); }
});

export default router;
