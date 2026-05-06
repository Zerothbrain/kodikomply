import { Router, Request, Response } from 'express';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

router.post('/generate', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { calculationType, result, input } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedResult: Record<string, unknown> = result;

    // Try puppeteer, fall back to JSON summary
    let pdfBuffer: Buffer | null = null;
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();

      const html = buildReportHTML(calculationType, input, result);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
    } catch (e) {
      console.warn('Puppeteer unavailable, falling back to HTML response:', e);
    }

    if (pdfBuffer) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="kodicomply-${calculationType}-report.pdf"`);
      res.send(pdfBuffer);
    } else {
      // Save and return JSON for client-side PDF generation
      res.json({ calculationType, input, result, generatedAt: new Date().toISOString() });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

router.get('/history', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Authentication required' }); return; }
  try {
    const calcs = await prisma.calculation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const parsed = calcs.map(c => ({
      ...c,
      inputData: JSON.parse(c.inputData as string),
      resultData: JSON.parse(c.resultData as string),
    }));
    res.json(parsed);
  } catch {
    res.status(500).json({ error: 'Failed to fetch calculation history' });
  }
});

function buildReportHTML(type: string, input: Record<string, unknown>, result: Record<string, unknown>): string {
  const now = new Date().toLocaleDateString('en-TZ', { dateStyle: 'long' });
  const typeLabels: Record<string, string> = {
    employment: 'Employment Income Tax',
    business: 'Business Income Tax',
    vat: 'Value Added Tax (VAT)',
    withholding: 'Withholding Tax',
    investment: 'Investment Income Tax',
    corporate: 'Corporate Tax',
    terminal_benefits: 'Terminal Benefits Tax',
    penalties: 'Penalties & Interest',
  };

  const breakdown = (result.breakdown as Array<{ description: string; amount: number; taxable?: boolean; reason?: string; notes?: string }> | undefined) ?? [];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 40px; }
    .header { background: #1a5c38; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 4px 0 0; opacity: 0.8; }
    .section { margin-bottom: 20px; }
    .section h2 { color: #1a5c38; border-bottom: 2px solid #1a5c38; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f7f3; text-align: left; padding: 8px 12px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    .amount { text-align: right; font-family: monospace; }
    .taxable { color: #dc2626; }
    .exempt { color: #16a34a; }
    .total-row td { font-weight: bold; background: #f0f7f3; }
    .footer { margin-top: 40px; font-size: 11px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>KodiComply — ${typeLabels[type] ?? type} Report</h1>
    <p>Generated: ${now} | Tanzania Revenue Authority Compliant</p>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <table>
      ${Object.entries(result)
        .filter(([k]) => !['breakdown', 'explanation'].includes(k))
        .map(([k, v]) => `<tr>
          <td>${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</td>
          <td class="amount">${typeof v === 'number' ? `TZS ${v.toLocaleString()}` : String(v)}</td>
        </tr>`).join('')}
    </table>
  </div>

  ${breakdown.length > 0 ? `
  <div class="section">
    <h2>Detailed Breakdown</h2>
    <table>
      <tr><th>Description</th><th class="amount">Amount (TZS)</th><th>Status</th></tr>
      ${breakdown.map(item => `<tr>
        <td>${item.description}</td>
        <td class="amount">${item.amount.toLocaleString()}</td>
        <td class="${item.taxable ? 'taxable' : 'exempt'}">${item.taxable !== undefined ? (item.taxable ? 'Taxable' : 'Exempt') : ''}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  ${result.explanation ? `
  <div class="section">
    <h2>Explanation</h2>
    <p>${result.explanation}</p>
  </div>` : ''}

  <div class="footer">
    <p>This report is generated by KodiComply and is for informational purposes only. Always consult a registered tax consultant for advice specific to your situation.</p>
    <p>KodiComply • Tanzania Tax Compliance Platform • kodicomply.co.tz</p>
  </div>
</body>
</html>`;
}

export default router;
