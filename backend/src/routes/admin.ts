import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import prisma from '../lib/prisma';

const router = Router();
router.use(authenticate, adminOnly);

// ── TAX RULES ──────────────────────────────────────────────────────────────
router.get('/tax-rules', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.taxRule.findMany({ orderBy: [{ category: 'asc' }, { minValue: 'asc' }] })); }
  catch { res.status(500).json({ error: 'Failed to fetch tax rules' }); }
});
router.post('/tax-rules', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.taxRule.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/tax-rules/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.taxRule.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/tax-rules/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.taxRule.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── DEDUCTIONS ─────────────────────────────────────────────────────────────
router.get('/deductions', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.deduction.findMany({ orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch deductions' }); }
});
router.post('/deductions', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.deduction.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/deductions/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.deduction.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/deductions/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.deduction.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── EXEMPTIONS ─────────────────────────────────────────────────────────────
router.get('/exemptions', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.exemption.findMany({ orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch exemptions' }); }
});
router.post('/exemptions', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.exemption.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/exemptions/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.exemption.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/exemptions/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.exemption.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── WITHHOLDING RATES ───────────────────────────────────────────────────────
router.get('/withholding-rates', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.withholdingRate.findMany({ orderBy: { paymentType: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch withholding rates' }); }
});
router.post('/withholding-rates', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.withholdingRate.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/withholding-rates/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.withholdingRate.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/withholding-rates/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.withholdingRate.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── CORPORATE RATES ─────────────────────────────────────────────────────────
router.get('/corporate-rates', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.corporateRate.findMany({ orderBy: { entityType: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch corporate rates' }); }
});
router.post('/corporate-rates', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.corporateRate.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/corporate-rates/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.corporateRate.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── FILING DEADLINES ────────────────────────────────────────────────────────
router.get('/deadlines', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.filingDeadline.findMany({ orderBy: { taxType: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch deadlines' }); }
});
router.post('/deadlines', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.filingDeadline.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/deadlines/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.filingDeadline.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── USERS ───────────────────────────────────────────────────────────────────
router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json(await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, _count: { select: { calculations: true } } },
      orderBy: { createdAt: 'desc' },
    }));
  } catch { res.status(500).json({ error: 'Failed to fetch users' }); }
});
router.put('/users/:id/deactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await prisma.user.update({ where: { id: Number(req.params.id) }, data: { isActive: false }, select: { id: true, name: true, email: true, isActive: true } }));
  } catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

router.get('/calculations', async (_req: Request, res: Response): Promise<void> => {
  try {
    const calcs = await prisma.calculation.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(calcs.map(c => ({ ...c, inputData: JSON.parse(c.inputData as string), resultData: JSON.parse(c.resultData as string) })));
  } catch { res.status(500).json({ error: 'Failed to fetch calculations' }); }
});

// ── BENEFITS IN KIND ────────────────────────────────────────────────────────
router.get('/benefits-in-kind', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.benefitInKind.findMany({ orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch benefits in kind' }); }
});
router.post('/benefits-in-kind', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.benefitInKind.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/benefits-in-kind/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.benefitInKind.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/benefits-in-kind/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.benefitInKind.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── RETIREMENT FUNDS ────────────────────────────────────────────────────────
router.get('/retirement-funds', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.retirementFund.findMany({ orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch retirement funds' }); }
});
router.post('/retirement-funds', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.retirementFund.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/retirement-funds/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.retirementFund.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/retirement-funds/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.retirementFund.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── EXEMPT AMOUNTS ──────────────────────────────────────────────────────────
router.get('/exempt-amounts', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.exemptAmount.findMany({ orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed to fetch exempt amounts' }); }
});
router.post('/exempt-amounts', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.exemptAmount.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/exempt-amounts/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.exemptAmount.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/exempt-amounts/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.exemptAmount.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── TRANSLATIONS ────────────────────────────────────────────────────────────
router.get('/translations', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.translation.findMany({ orderBy: [{ language: 'asc' }, { category: 'asc' }, { key: 'asc' }] })); }
  catch { res.status(500).json({ error: 'Failed to fetch translations' }); }
});
router.post('/translations', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.translation.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/translations/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.translation.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/translations/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.translation.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── LOSS TRACKING ───────────────────────────────────────────────────────────
router.get('/losses', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json(await prisma.lossCarryforward.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ userId: 'asc' }, { yearOfIncome: 'desc' }],
    }));
  } catch { res.status(500).json({ error: 'Failed to fetch loss records' }); }
});
router.post('/losses', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.lossCarryforward.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/losses/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.lossCarryforward.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── VAT EXEMPT ITEMS ────────────────────────────────────────────────────────
router.get('/vat-exempt-items', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.vatExemptItem.findMany({ orderBy: [{ category: 'asc' }, { itemName: 'asc' }] })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
router.post('/vat-exempt-items', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.vatExemptItem.create({ data: { ...req.body, effectiveFrom: new Date(req.body.effectiveFrom ?? Date.now()) } })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/vat-exempt-items/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.vatExemptItem.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/vat-exempt-items/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.vatExemptItem.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── VAT EXEMPT IMPORTS ──────────────────────────────────────────────────────
router.get('/vat-exempt-imports', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.vatExemptImport.findMany({ orderBy: { itemNumber: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
router.post('/vat-exempt-imports', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.vatExemptImport.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/vat-exempt-imports/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.vatExemptImport.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/vat-exempt-imports/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.vatExemptImport.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── REAL ESTATE VAT RULES ───────────────────────────────────────────────────
router.get('/real-estate-vat-rules', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.realEstateVatRule.findMany({ orderBy: { id: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
router.put('/real-estate-vat-rules/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.realEstateVatRule.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── VEHICLE BENEFIT TABLE ────────────────────────────────────────────────────
router.get('/vehicle-benefit-table', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.vehicleBenefitTable.findMany({ orderBy: { engineSizeFrom: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
router.put('/vehicle-benefit-table/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.vehicleBenefitTable.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── DIGITAL SERVICES ─────────────────────────────────────────────────────────
router.get('/digital-service-types', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.digitalServiceType.findMany({ orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
router.post('/digital-service-types', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.digitalServiceType.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/digital-service-types/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.digitalServiceType.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/digital-service-types/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.digitalServiceType.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── TREATY COUNTRIES ─────────────────────────────────────────────────────────
router.get('/treaty-countries', async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.treatyCountry.findMany({ orderBy: { countryName: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
router.post('/treaty-countries', async (req: Request, res: Response): Promise<void> => {
  try { res.status(201).json(await prisma.treatyCountry.create({ data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.put('/treaty-countries/:id', async (req: Request, res: Response): Promise<void> => {
  try { res.json(await prisma.treatyCountry.update({ where: { id: Number(req.params.id) }, data: req.body })); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});
router.delete('/treaty-countries/:id', async (req: Request, res: Response): Promise<void> => {
  try { await prisma.treatyCountry.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); }
  catch (e: unknown) { res.status(400).json({ error: String(e) }); }
});

// ── Email Templates ───────────────────────────────────────────────────────────

router.get('/email-templates', async (_req: Request, res: Response): Promise<void> => {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { slug: 'asc' } });
  res.json(templates.map(t => ({ ...t, variables: JSON.parse(t.variables) })));
});

router.get('/email-templates/:slug', async (req: Request, res: Response): Promise<void> => {
  const t = await prisma.emailTemplate.findUnique({ where: { slug: req.params.slug } });
  if (!t) { res.status(404).json({ error: 'Template not found' }); return; }
  res.json({ ...t, variables: JSON.parse(t.variables) });
});

router.put('/email-templates/:slug', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, subject, htmlBody, textBody, isActive } = req.body as {
    name?: string; subject?: string; htmlBody?: string; textBody?: string; isActive?: boolean;
  };
  try {
    const t = await prisma.emailTemplate.update({
      where: { slug: req.params.slug },
      data: {
        ...(name      !== undefined && { name }),
        ...(subject   !== undefined && { subject }),
        ...(htmlBody  !== undefined && { htmlBody }),
        ...(textBody  !== undefined && { textBody }),
        ...(isActive  !== undefined && { isActive }),
        updatedBy: req.user?.id ?? null,
      },
    });
    res.json({ ...t, variables: JSON.parse(t.variables) });
  } catch { res.status(404).json({ error: 'Template not found' }); }
});

router.post('/email-templates/:slug/test', async (req: AuthRequest, res: Response): Promise<void> => {
  const { to } = req.body as { to: string };
  if (!to) { res.status(400).json({ error: 'Recipient email required' }); return; }
  const { sendEmail } = await import('../lib/email');
  await sendEmail({
    to,
    templateSlug: req.params.slug,
    vars: {
      userName: 'Test User', verifyUrl: 'https://kodicomply.co.tz/verify-email?token=test',
      loginUrl: 'https://kodicomply.co.tz/dashboard', siteUrl: 'https://kodicomply.co.tz',
      calculationType: 'Employment Tax (PAYE)', date: new Date().toLocaleDateString(),
      keyResults: '<p style="color:#166534;font-size:13px;"><strong>PAYE Due:</strong> TZS 212,000</p>',
      dashboardUrl: 'https://kodicomply.co.tz/dashboard',
    },
  });
  res.json({ success: true, message: `Test email sent to ${to}` });
});

export default router;
