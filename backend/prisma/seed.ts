import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const EFFECTIVE_FROM = new Date('2024-01-01');

async function main() {
  console.log('Seeding KodiComply database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@KodiComply2024', 12);
  await prisma.user.upsert({
    where: { email: 'admin@kodicomply.co.tz' },
    update: { isEmailVerified: true },
    create: { name: 'KodiComply Admin', email: 'admin@kodicomply.co.tz', password: adminPassword, role: 'ADMIN', isEmailVerified: true },
  });
  console.log('Admin user created: admin@kodicomply.co.tz / Admin@KodiComply2024');

  // Test user (pre-verified)
  const userPassword = await bcrypt.hash('User@KodiComply2024', 12);
  await prisma.user.upsert({
    where: { email: 'user@kodicomply.co.tz' },
    update: { isEmailVerified: true },
    create: { name: 'Test User', email: 'user@kodicomply.co.tz', password: userPassword, role: 'USER', isEmailVerified: true },
  });
  console.log('Test user created:  user@kodicomply.co.tz  / User@KodiComply2024');

  // ── PAYE BANDS (MONTHLY — converted from First Schedule ITA annual bands) ────
  // Annual: 0–3,240,000 → NIL; 3,240,001–6,240,000 → 8%; 6,240,001–9,120,000 → 240k+20%;
  //         9,120,001–12,000,000 → 816k+25%; >12,000,000 → 1,536k+30%
  await prisma.taxRule.deleteMany({ where: { category: 'PAYE_BAND' } });
  const payeBands = [
    { name: 'Band 1 — 0% (0–270,000)',        minValue: 0,       maxValue: 270000,  rate: 0,    fixedAmount: null },
    { name: 'Band 2 — 8% (270,001–520,000)',   minValue: 270000,  maxValue: 520000,  rate: 0.08, fixedAmount: null },
    { name: 'Band 3 — 20% (520,001–760,000)',  minValue: 520000,  maxValue: 760000,  rate: 0.20, fixedAmount: null },
    { name: 'Band 4 — 25% (760,001–1,000,000)',minValue: 760000,  maxValue: 1000000, rate: 0.25, fixedAmount: null },
    { name: 'Band 5 — 30% (above 1,000,000)', minValue: 1000000, maxValue: null,    rate: 0.30, fixedAmount: null },
  ];
  for (const b of payeBands) {
    await prisma.taxRule.create({
      data: { category: 'PAYE_BAND', valueType: 'BRACKET', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: 'Monthly PAYE band (TZS) — First Schedule ITA Cap 332 R.E.2023', ...b },
    });
  }
  console.log('PAYE bands seeded (corrected: 8% on Band 2)');

  // ── PRESUMPTIVE TAX — NON S.43 COMPLIANT ─────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'PRESUMPTIVE' } });
  const presumptiveNonS43 = [
    { name: 'NIL (≤4,000,000)',         minValue: 0,        maxValue: 4000000,   rate: 0,     fixedAmount: 0,      notes: 'Exempt — below threshold' },
    { name: 'TZS 100,000 fixed',        minValue: 4000001,  maxValue: 7000000,   rate: null,  fixedAmount: 100000, notes: 'Not complying with S.43 TAA — fixed amount' },
    { name: 'TZS 250,000 fixed',        minValue: 7000001,  maxValue: 11000000,  rate: null,  fixedAmount: 250000, notes: 'Not complying with S.43 TAA — fixed amount' },
    { name: '3.5% of turnover',         minValue: 11000001, maxValue: 100000000, rate: 0.035, fixedAmount: null,   notes: '3.5% — same rate for both S43/non-S43 above 11M' },
  ];
  for (const p of presumptiveNonS43) {
    await prisma.taxRule.create({
      data: { category: 'PRESUMPTIVE', valueType: p.rate ? 'PERCENTAGE' : 'FIXED', effectiveFrom: EFFECTIVE_FROM, isActive: true, ...p },
    });
  }

  // ── PRESUMPTIVE TAX — S.43 COMPLIANT ─────────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'PRESUMPTIVE_S43' } });
  const presumptiveS43 = [
    { name: 'NIL (≤4,000,000)',         minValue: 0,        maxValue: 4000000,   rate: 0,     fixedAmount: 0,    excess: 0,       notes: 'Exempt — below threshold' },
    { name: '3% excess over 4,000,000', minValue: 4000001,  maxValue: 7000000,   rate: 0.03,  fixedAmount: null, excess: 4000000, notes: 'S.43 compliant — 3% of excess over 4M' },
    { name: '90k + 3% excess over 7M',  minValue: 7000001,  maxValue: 11000000,  rate: 0.03,  fixedAmount: 90000,excess: 7000000, notes: 'S.43 compliant — 90k + 3% of excess over 7M' },
    { name: '3.5% of turnover',         minValue: 11000001, maxValue: 100000000, rate: 0.035, fixedAmount: null, excess: 0,       notes: '3.5% — same rate for both S43/non-S43 above 11M' },
  ];
  for (const p of presumptiveS43) {
    const { excess, ...data } = p;
    await prisma.taxRule.create({
      data: { category: 'PRESUMPTIVE_S43', valueType: p.rate ? 'PERCENTAGE' : 'FIXED', effectiveFrom: EFFECTIVE_FROM, isActive: true, ...data, notes: `${data.notes}|excess:${excess}` },
    });
  }
  console.log('Presumptive tax seeded (two-column: S43 / non-S43)');

  // ── VAT SETTINGS ─────────────────────────────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'VAT' } });
  const vatRules = [
    { name: 'Standard Rate',                   rate: 0.18,       fixedAmount: null,     valueType: 'PERCENTAGE', notes: 'Standard VAT rate 18%' },
    { name: 'Export Rate',                      rate: 0,          fixedAmount: null,     valueType: 'PERCENTAGE', notes: 'Zero-rated exports' },
    { name: 'Registration Threshold Annual',    rate: null,       fixedAmount: 200000000,valueType: 'FIXED',      notes: 'TZS 200M annual turnover' },
    { name: 'Registration Threshold 6 Month',  rate: null,       fixedAmount: 100000000,valueType: 'FIXED',      notes: 'TZS 100M in any 6-month period' },
    { name: 'Tax Fraction',                     rate: 0.18/1.18,  fixedAmount: null,     valueType: 'PERCENTAGE', notes: '18/118 — extract VAT from VAT-inclusive price' },
  ];
  for (const v of vatRules) {
    await prisma.taxRule.create({ data: { category: 'VAT', effectiveFrom: EFFECTIVE_FROM, isActive: true, minValue: null, maxValue: null, ...v } });
  }
  console.log('VAT settings seeded');

  // ── SDL ───────────────────────────────────────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'SDL' } });
  await prisma.taxRule.create({
    data: { category: 'SDL', name: 'SDL Rate', rate: 0.04, fixedAmount: null, valueType: 'PERCENTAGE', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: '4% of gross payroll — employer levy' },
  });

  // ── DEPRECIATION RATES — Third Schedule ITA ───────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'DEPRECIATION' } });
  const depRates = [
    { name: '1', rate: 0.375, notes: 'Class 1 — computers, data handling, small vehicles (<30 seats), goods vehicles (<7T), construction/earth-moving equipment. 37.5% diminishing balance.' },
    { name: '2', rate: 0.25,  notes: 'Class 2 — large buses (30+ seats), heavy trucks, aircraft, vessels, agricultural/manufacturing plant, irrigation equipment. 25% diminishing balance.' },
    { name: '3', rate: 0.125, notes: 'Class 3 — office furniture, fixtures, equipment, all other assets not elsewhere classified. 12.5% diminishing balance.' },
    { name: '5', rate: 0.20,  notes: 'Class 5 — general straight-line assets. 20% straight line.' },
    { name: '6', rate: 0.05,  notes: 'Class 6 — buildings and permanent structures. 5% straight line.' },
    { name: '8', rate: 1.0,   notes: 'Class 8 — agricultural plant, windmills, electric generators, EFD devices (non-VAT), prospecting/exploration equipment. 100% diminishing balance.' },
  ];
  for (const d of depRates) {
    await prisma.taxRule.create({
      data: { category: 'DEPRECIATION', valueType: 'PERCENTAGE', effectiveFrom: EFFECTIVE_FROM, isActive: true, minValue: null, maxValue: null, fixedAmount: null, ...d },
    });
  }
  // Class 7 stored separately — rate = 1/useful_life
  await prisma.taxRule.create({
    data: { category: 'DEPRECIATION', name: '7', rate: null, fixedAmount: null, valueType: 'CUSTOM', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: 'Class 7 — assets with specific useful life. Rate = 1 ÷ useful life (rounded to nearest 0.5 year). Straight line.' },
  });
  // Pool write-off rule
  await prisma.taxRule.deleteMany({ where: { category: 'DEPRECIATION_WRITEOFF' } });
  await prisma.taxRule.create({
    data: { category: 'DEPRECIATION_WRITEOFF', name: 'Pool write-off threshold', rate: null, fixedAmount: 1000000, valueType: 'FIXED', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: 'If depreciation basis after depreciation < TZS 1,000,000, write off entire remaining balance.' },
  });
  console.log('Depreciation rates seeded (corrected: 8 classes, Class 4 removed)');

  // ── CAPITAL GAINS THRESHOLD ───────────────────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'CAPITAL_GAINS' } });
  await prisma.taxRule.create({
    data: { category: 'CAPITAL_GAINS', name: 'Flat rate threshold (annual)', rate: 0.10, fixedAmount: 3240000, valueType: 'PERCENTAGE', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: '10% flat rate on gains from shares/securities when total income > TZS 3,240,000. First Schedule Para 1(2).' },
  });

  // ── RESIDENTIAL BENEFIT SETTINGS ─────────────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'RESIDENTIAL_BENEFIT' } });
  await prisma.taxRule.create({
    data: { category: 'RESIDENTIAL_BENEFIT', name: 'Residential benefit % of income', rate: 0.15, fixedAmount: 600000, valueType: 'PERCENTAGE', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: 'Taxable benefit = lower of (market rent) or (greater of 15% of income or TZS 600,000 p.a.) less rent paid by employee. S.27(1)(c) ITA.' },
  });

  // ── CURRENCY POINT & INTEREST RATE ────────────────────────────────────────
  await prisma.taxRule.deleteMany({ where: { category: 'CURRENCY_POINT' } });
  await prisma.taxRule.create({
    data: { category: 'CURRENCY_POINT', name: 'Currency Point Value', rate: null, fixedAmount: 15000, valueType: 'FIXED', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: 'TZS 15,000 per currency point' },
  });
  await prisma.taxRule.deleteMany({ where: { category: 'INTEREST_RATE' } });
  await prisma.taxRule.create({
    data: { category: 'INTEREST_RATE', name: 'Statutory Interest Rate', rate: 0.12, fixedAmount: null, valueType: 'PERCENTAGE', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: '12% per annum — used for late payment compound interest and low-interest loan benefit' },
  });
  // NSSF contribution rates (retirement)
  await prisma.taxRule.deleteMany({ where: { category: 'NSSF_RATE' } });
  await prisma.taxRule.create({
    data: { category: 'NSSF_RATE', name: 'NSSF Employee Rate', rate: 0.10, fixedAmount: null, valueType: 'PERCENTAGE', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: '10% employee contribution' },
  });
  await prisma.taxRule.create({
    data: { category: 'NSSF_RATE', name: 'NSSF Employer Rate', rate: 0.10, fixedAmount: null, valueType: 'PERCENTAGE', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: '10% employer contribution' },
  });
  // Presumptive threshold
  await prisma.taxRule.deleteMany({ where: { category: 'PRESUMPTIVE_THRESHOLD' } });
  await prisma.taxRule.create({
    data: { category: 'PRESUMPTIVE_THRESHOLD', name: 'Presumptive tax upper limit', rate: null, fixedAmount: 100000000, valueType: 'FIXED', effectiveFrom: EFFECTIVE_FROM, isActive: true, notes: 'TZS 100M — above this, normal corporate/business income tax applies. VAT threshold is 200M (separate).' },
  });
  console.log('Currency point, interest rate, NSSF rates, thresholds seeded');

  // ── WITHHOLDING RATES — corrected from First Schedule ─────────────────────
  await prisma.withholdingRate.deleteMany({});
  const whtRates = [
    { paymentType: 'Service fees',              recipientType: 'RESIDENT',     rate: 0.05, isFinal: false, notes: '5% non-final WHT on service fees to residents (S.107)' },
    { paymentType: 'Service fees',              recipientType: 'NON_RESIDENT', rate: 0.15, isFinal: true,  notes: '15% final WHT on service fees to non-residents' },
    { paymentType: 'Goods supplied (S.107)',    recipientType: 'RESIDENT',     rate: 0.02, isFinal: false, notes: '2% non-final WHT on goods supplied by resident corporation' },
    { paymentType: 'Rent',                      recipientType: 'RESIDENT',     rate: 0.10, isFinal: true,  notes: '10% final WHT on rent to residents' },
    { paymentType: 'Rent',                      recipientType: 'NON_RESIDENT', rate: 0.10, isFinal: true,  notes: '10% final WHT on rent to non-residents' },
    { paymentType: 'Dividends (DSE-listed / S.54(2))',recipientType: 'RESIDENT',rate: 0.05,isFinal: true, notes: '5% final WHT — dividends from DSE-listed company or where S.54(2) applies' },
    { paymentType: 'Dividends (other corporations)',  recipientType: 'RESIDENT',rate: 0.10,isFinal: true, notes: '10% final WHT on dividends from non-listed corporations' },
    { paymentType: 'Dividends',                 recipientType: 'NON_RESIDENT', rate: 0.10, isFinal: true,  notes: '10% final WHT on dividends to non-residents' },
    { paymentType: 'Interest',                  recipientType: 'RESIDENT',     rate: 0.10, isFinal: true,  notes: '10% final WHT on interest to residents' },
    { paymentType: 'Interest',                  recipientType: 'NON_RESIDENT', rate: 0.10, isFinal: true,  notes: '10% final WHT on interest to non-residents' },
    { paymentType: 'Royalties',                 recipientType: 'RESIDENT',     rate: 0.10, isFinal: true,  notes: '10% final WHT on royalties to residents' },
    { paymentType: 'Royalties',                 recipientType: 'NON_RESIDENT', rate: 0.10, isFinal: true,  notes: '10% final WHT on royalties to non-residents' },
    { paymentType: 'Other investment payments', recipientType: 'RESIDENT',     rate: 0.15, isFinal: true,  notes: '15% final WHT on other investment payments' },
    { paymentType: 'Director fees',             recipientType: 'RESIDENT',     rate: 0.15, isFinal: true,  notes: '15% final WHT on director fees' },
    { paymentType: 'Insurance premium',         recipientType: 'NON_RESIDENT', rate: 0.05, isFinal: true,  notes: '5% final WHT on insurance premiums to non-residents' },
    { paymentType: 'Money transfer commission', recipientType: 'RESIDENT',     rate: 0.10, isFinal: false, notes: '10% non-final WHT on money transfer commission' },
    { paymentType: 'Commuted pension',          recipientType: 'RESIDENT',     rate: 0.10, isFinal: true,  notes: '10% final WHT on commuted pension to residents' },
    { paymentType: 'Commuted pension',          recipientType: 'NON_RESIDENT', rate: 0.10, isFinal: true,  notes: '10% final WHT on commuted pension to non-residents' },
  ];
  for (const w of whtRates) {
    await prisma.withholdingRate.create({ data: { effectiveFrom: EFFECTIVE_FROM, isActive: true, ...w } as Parameters<typeof prisma.withholdingRate.create>[0]['data'] });
  }
  console.log('Withholding rates seeded (corrected: dividends 5%/10%, royalties 10%, director fees 15% final)');

  // ── CORPORATE RATES ───────────────────────────────────────────────────────
  await prisma.corporateRate.deleteMany({});
  const corpRates = [
    { entityType: 'Standard resident company',                    rate: 0.30,  conditions: 'Default rate for resident companies',                                    notes: 'Standard 30% corporate tax rate' },
    { entityType: 'New DSE listed company (30%+ public float)',   rate: 0.25,  conditions: 'New listing on DSE with ≥30% public float — applies for 3 years',       notes: '25% for 3 years from date of listing' },
    { entityType: 'Motor vehicle/tractor assembler',              rate: 0.10,  conditions: 'Performance agreement with government — assembling motor vehicles/tractors',notes: '10% for 5 years' },
    { entityType: 'Pharmaceuticals/leather manufacturer',         rate: 0.20,  conditions: 'Performance agreement with government',                                  notes: '20% for 5 years' },
    { entityType: 'Perpetual unrelieved loss (3+ years)',         rate: 0.005, conditions: 'Company with unrelieved loss for 3 or more consecutive years',           notes: '0.5% of turnover — minimum tax' },
    { entityType: 'Repatriated income (domestic PE)',             rate: 0.10,  conditions: 'Income repatriated by domestic permanent establishment of foreign enterprise',notes: '10% additional tax on repatriated profits' },
    { entityType: 'Non-resident company',                         rate: 0.30,  conditions: 'Non-resident company with Tanzanian-source income',                      notes: '30% — same as resident' },
  ];
  for (const c of corpRates) {
    await prisma.corporateRate.create({ data: { startDate: EFFECTIVE_FROM, isActive: true, ...c } });
  }
  console.log('Corporate rates seeded');

  // ── FILING DEADLINES ──────────────────────────────────────────────────────
  await prisma.filingDeadline.deleteMany({});
  const deadlines = [
    { taxType: 'PAYE',                     description: 'Monthly PAYE return and payment',                          dueDayOfMonth: 7,  dueMonth: null, frequency: 'MONTHLY',   reminderDays: 5,  notes: '7th day of the following month' },
    { taxType: 'SDL',                      description: 'Monthly Skills Development Levy payment',                  dueDayOfMonth: 7,  dueMonth: null, frequency: 'MONTHLY',   reminderDays: 5,  notes: '7th day of the following month' },
    { taxType: 'WHT',                      description: 'Monthly Withholding Tax return and payment',               dueDayOfMonth: 7,  dueMonth: null, frequency: 'MONTHLY',   reminderDays: 5,  notes: '7th day of the following month' },
    { taxType: 'VAT',                      description: 'Monthly VAT return and payment',                           dueDayOfMonth: 20, dueMonth: null, frequency: 'MONTHLY',   reminderDays: 7,  notes: '20th day of the following month' },
    { taxType: 'Quarterly Installment Q1', description: 'First quarterly income tax installment',                   dueDayOfMonth: 31, dueMonth: 3,    frequency: 'QUARTERLY', reminderDays: 14, notes: 'March 31 of the year of income' },
    { taxType: 'Quarterly Installment Q2', description: 'Second quarterly income tax installment',                  dueDayOfMonth: 30, dueMonth: 6,    frequency: 'QUARTERLY', reminderDays: 14, notes: 'June 30 of the year of income' },
    { taxType: 'Quarterly Installment Q3', description: 'Third quarterly income tax installment',                   dueDayOfMonth: 30, dueMonth: 9,    frequency: 'QUARTERLY', reminderDays: 14, notes: 'September 30 of the year of income' },
    { taxType: 'Quarterly Installment Q4', description: 'Fourth quarterly income tax installment',                  dueDayOfMonth: 31, dueMonth: 12,   frequency: 'QUARTERLY', reminderDays: 14, notes: 'December 31 of the year of income' },
    { taxType: 'Annual Income Tax',        description: 'Annual income tax return filing and final payment',        dueDayOfMonth: 30, dueMonth: 6,    frequency: 'ANNUAL',    reminderDays: 30, notes: '6 months after year end' },
    { taxType: 'Presumptive Tax',          description: 'Annual presumptive tax return and payment',                dueDayOfMonth: 30, dueMonth: 6,    frequency: 'ANNUAL',    reminderDays: 14, notes: 'Annual — for small businesses under TZS 100M turnover' },
    { taxType: 'WCF',                      description: 'Workers Compensation Fund annual contribution',            dueDayOfMonth: 31, dueMonth: 3,    frequency: 'ANNUAL',    reminderDays: 14, notes: 'Annual contribution to Workers Compensation Fund' },
  ];
  for (const d of deadlines) {
    await prisma.filingDeadline.create({ data: d as Parameters<typeof prisma.filingDeadline.create>[0]['data'] });
  }
  console.log('Filing deadlines seeded');

  // ── DEDUCTIONS ────────────────────────────────────────────────────────────
  await prisma.deduction.deleteMany({});
  const deductions = [
    { name: 'NSSF Employee Contribution',     category: 'Employment', isPercentage: true,  percentageRate: 0.10, conditions: 'Statutory: 10% of gross salary (employee share)',                              effectiveFrom: EFFECTIVE_FROM, notes: 'National Social Security Fund' },
    { name: 'Approved Retirement Fund',       category: 'Employment', isPercentage: false, maxAmount: null,      conditions: 'Actual contributions to an approved retirement fund, or statutory — whichever is lesser', effectiveFrom: EFFECTIVE_FROM, notes: 'S.61 ITA — only approved funds qualify' },
    { name: 'Donations to TEA Education Fund',category: 'Business',   isPercentage: false, conditions: 'Fully deductible — no cap',                                                   effectiveFrom: EFFECTIVE_FROM, notes: '' },
    { name: 'Other Donations',                category: 'Business',   isPercentage: true,  percentageRate: 0.02, conditions: 'Capped at 2% of business income before donation deduction',                   effectiveFrom: EFFECTIVE_FROM, notes: '' },
  ];
  for (const d of deductions) {
    await prisma.deduction.create({ data: { isActive: true, ...d } });
  }

  // ── EXEMPTIONS ────────────────────────────────────────────────────────────
  await prisma.exemption.deleteMany({});
  const exemptions = [
    { name: 'Exact expense reimbursement',          applicableTo: 'INDIVIDUAL', conditions: 'Allowance equal to actual expenditure incurred on behalf of employer — excess is taxable' },
    { name: 'Non-discriminatory medical services',  applicableTo: 'INDIVIDUAL', conditions: 'Available to all employees, covers employee + spouse + up to 4 children' },
    { name: 'Private residence gain',               applicableTo: 'INDIVIDUAL', conditions: 'Gain ≤ TZS 15,000,000, owned and used as private residence for 3+ years' },
    { name: 'Agricultural land gain',               applicableTo: 'INDIVIDUAL', conditions: 'Market value < TZS 10,000,000, used for agriculture in 2 of last 3 years' },
    { name: 'DSE shares gain',                      applicableTo: 'ALL',        conditions: 'Shares listed on DSE, ownership < 25%' },
    { name: 'Subsistence farming income',           applicableTo: 'INDIVIDUAL', conditions: 'Individual farmer, lives off produce, annual sales < TZS 3,000,000' },
    { name: 'Scholarship income',                   applicableTo: 'INDIVIDUAL', conditions: 'Received for full-time instruction, education or research' },
    { name: 'Life insurance from resident insurer', applicableTo: 'INDIVIDUAL', conditions: 'Proceeds from life insurance policy issued by resident insurer' },
    { name: 'Foreign service allowance',            applicableTo: 'INDIVIDUAL', conditions: 'Government employee serving abroad — certified by Treasury' },
    { name: 'Board sitting allowance (public institution)', applicableTo: 'INDIVIDUAL', conditions: 'Member of public institution receiving board sitting allowance' },
    { name: 'Government employee allowances',       applicableTo: 'INDIVIDUAL', conditions: 'Housing, transport, responsibility, extra duty, overtime, hardship, honoraria — government employees only' },
    { name: 'Cafeteria services (non-discriminatory)', applicableTo: 'INDIVIDUAL', conditions: 'Employer-provided cafeteria/meal services available to all employees on non-discriminatory basis' },
    { name: 'Work-to-domicile travel',              applicableTo: 'INDIVIDUAL', conditions: 'Travel benefit for employee specifically recruited to work > 20 miles from domicile' },
    { name: 'Government vehicle benefit',           applicableTo: 'INDIVIDUAL', conditions: 'Motor vehicle provided by government employer where employer claims no deduction' },
    { name: 'Government residential premises',      applicableTo: 'INDIVIDUAL', conditions: 'Residential premises provided by government employer' },
  ];
  for (const e of exemptions) {
    await prisma.exemption.create({ data: { isActive: true, ...e } as Parameters<typeof prisma.exemption.create>[0]['data'] });
  }
  console.log('Deductions and exemptions seeded');

  // ── BENEFITS IN KIND (Fifth Schedule + S.27 ITA) ──────────────────────────
  await prisma.benefitInKind.deleteMany({});
  const vehicleBenefitTable = JSON.stringify({
    brackets: [
      { maxCC: 1000,  youngMonthly: 250000, oldMonthly: 125000 },
      { maxCC: 2000,  youngMonthly: 500000, oldMonthly: 250000 },
      { maxCC: 3000,  youngMonthly: 1000000,oldMonthly: 500000 },
      { maxCC: null,  youngMonthly: 1500000,oldMonthly: 750000 },
    ],
    ageThresholdYears: 5,
    description: 'Monthly amounts per Fifth Schedule ITA. young = vehicle <5 years old, old = vehicle >5 years old.',
  });
  const benefits = [
    { name: 'Motor vehicle use (Fifth Schedule)',   valuationMethod: 'TABLE',       valuationTable: vehicleBenefitTable, isExempt: false, notes: 'S.27(1)(a) — taxable only if employer claims deduction. Annual benefit = monthly × 12.' },
    { name: 'Residential premises (S.27(1)(c))',    valuationMethod: 'FORMULA',     valuationTable: null, isExempt: false, notes: 'Lower of: (i) market rent for period, or (ii) greater of 15% of income or TZS 600,000 p.a. Less rent paid by employee.' },
    { name: 'Low interest loan (S.27(1)(b))',        valuationMethod: 'FORMULA',     valuationTable: null, isExempt: false, notes: '(Loan amount × statutory rate) − (Loan amount × actual rate). Exempt if <12 months AND <3 months basic salary.' },
    { name: 'Cafeteria services (non-discriminatory)',valuationMethod: 'EXEMPT',     valuationTable: null, isExempt: true,  exemptionConditions: 'Available to all employees on non-discriminatory basis', notes: 'Fully exempt' },
    { name: 'Medical services (non-discriminatory)', valuationMethod: 'EXEMPT',     valuationTable: null, isExempt: true,  exemptionConditions: 'Non-discriminatory, covers employee + spouse + up to 4 children', notes: 'Fully exempt' },
    { name: 'Work-to-domicile travel',               valuationMethod: 'EXEMPT',     valuationTable: null, isExempt: true,  exemptionConditions: 'Employee specifically recruited, works >20 miles from domicile', notes: 'Fully exempt' },
    { name: 'Scholarship benefit',                   valuationMethod: 'EXEMPT',     valuationTable: null, isExempt: true,  exemptionConditions: 'Full-time instruction only', notes: 'Fully exempt' },
    { name: 'Board sitting allowance (public institution)',valuationMethod: 'EXEMPT',valuationTable: null, isExempt: true,  exemptionConditions: 'Public institution board member', notes: 'Fully exempt' },
    { name: 'Foreign service allowance (Treasury certified)',valuationMethod:'EXEMPT',valuationTable: null,isExempt: true,  exemptionConditions: 'Government officer, Treasury certified', notes: 'Fully exempt' },
    { name: 'Government vehicle (no deduction)',     valuationMethod: 'EXEMPT',     valuationTable: null, isExempt: true,  exemptionConditions: 'Government employer claims no deduction', notes: 'Fully exempt' },
    { name: 'Government residential premises',       valuationMethod: 'EXEMPT',     valuationTable: null, isExempt: true,  exemptionConditions: 'Government employer', notes: 'Fully exempt' },
  ];
  for (const b of benefits) {
    await prisma.benefitInKind.create({ data: { isActive: true, ...b } });
  }
  console.log('Benefits in kind seeded (11 types)');

  // ── RETIREMENT FUNDS ──────────────────────────────────────────────────────
  await prisma.retirementFund.deleteMany({});
  const funds = [
    { name: 'NSSF — National Social Security Fund', type: 'APPROVED', isResident: true, notes: 'Main social security fund — employer + employee 10% each' },
    { name: 'PPF — Parastatal Pension Fund',         type: 'APPROVED', isResident: true, notes: 'Parastatal pension' },
    { name: 'PSPF — Public Service Pension Fund',    type: 'APPROVED', isResident: true, notes: 'Government employees' },
    { name: 'GEPF — Government Employees Provident Fund', type: 'APPROVED', isResident: true, notes: '' },
    { name: 'LAPF — Local Authorities Provident Fund',    type: 'APPROVED', isResident: true, notes: 'Local government employees' },
    { name: 'NHIF — National Health Insurance Fund', type: 'APPROVED', isResident: true, notes: 'For approved retirement purposes' },
  ];
  for (const f of funds) {
    await prisma.retirementFund.create({ data: { isActive: true, ...f } });
  }
  console.log('Retirement funds seeded (6 approved funds)');

  // ── EXEMPT AMOUNTS — Second Schedule ITA ─────────────────────────────────
  await prisma.exemptAmount.deleteMany({});
  const exemptAmounts = [
    { name: "President's emoluments",                           applicableTo: 'INDIVIDUAL', legalReference: 'Second Schedule, para 1', description: "President's salary, duty allowance and entertainment allowance" },
    { name: 'Government income',                                applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 2', description: 'Government income, except from unrelated business activities' },
    { name: 'Diplomatic corps income',                          applicableTo: 'INDIVIDUAL', legalReference: 'Second Schedule, para 3', description: 'To the extent provided by the Diplomatic Immunities Act', conditions: 'Must be covered by Diplomatic Immunities Act' },
    { name: 'Foreign government employee income',               applicableTo: 'INDIVIDUAL', legalReference: 'Second Schedule, para 4', description: 'Resident only for that employment, paid from foreign public funds' },
    { name: 'Foreign source amounts — non-citizen foreign govt employees', applicableTo: 'INDIVIDUAL', legalReference: 'Second Schedule, para 5', description: 'Accompanying spouses and children also covered' },
    { name: 'East African Development Bank income',             applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 6', description: 'EADB institutional income' },
    { name: 'Price Stabilisation and Agricultural Inputs Trust',applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 7', description: '' },
    { name: 'Investor Compensation Fund income',                applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 8', description: '' },
    { name: 'Bank of Tanzania income',                          applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 9', description: '' },
    { name: 'Dar es Salaam Stock Exchange income',              applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 10', description: '' },
    { name: 'African Development Bank bonds income',            applicableTo: 'ALL',        legalReference: 'Second Schedule, para 11', description: 'Income from African Development Bank bonds and securities' },
    { name: 'Primary cooperative society income',               applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 12', description: 'Registered cooperative, agriculture/housing/distribution/SACCOS, turnover < TZS 100M', conditions: 'Must be registered primary cooperative, turnover below TZS 100M' },
    { name: 'Foreign living allowance (govt overseas service)', applicableTo: 'INDIVIDUAL', legalReference: 'Second Schedule, para 13', description: 'Government officers paid from public funds for overseas service' },
    { name: 'Gaming income (gaming tax paid)',                   applicableTo: 'ALL',        legalReference: 'Second Schedule, para 14', description: 'Where gaming tax has been paid under the Gaming Act' },
    { name: 'EPZ/SEZ income — first 10 years',                  applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 15', description: 'Except Category B SEZ investors', conditions: 'Must be EPZ/SEZ registered entity, within first 10 years' },
    { name: 'Investments under Zanzibar laws',                  applicableTo: 'ALL',        legalReference: 'Second Schedule, para 16', description: 'Investments exempted under Zanzibar laws' },
    { name: 'Crop funds — registered farmers cooperatives',     applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 17', description: '' },
    { name: 'Fidelity fund (Capital Markets and Securities Act)',applicableTo: 'ENTITY',    legalReference: 'Second Schedule, para 18', description: '' },
    { name: 'Interest on EADB bonds (DSE-listed)',              applicableTo: 'ALL',        legalReference: 'Second Schedule, para 19', description: 'Interest on East African Development Bank bonds listed on DSE' },
    { name: 'Unit trust redemption gains',                       applicableTo: 'INDIVIDUAL', legalReference: 'Second Schedule, para 20', description: 'Gains from transfer of unit trust units by a unit holder' },
    { name: 'Government interest/fees to non-resident banks',   applicableTo: 'ENTITY',     legalReference: 'Second Schedule, para 21', description: 'Qualifying government loan agreements with non-resident banks', conditions: 'Must be qualifying government loan agreement' },
    { name: 'Political Service Retirement Benefits',             applicableTo: 'INDIVIDUAL', legalReference: 'Second Schedule, Part V', description: 'Political Service Retirement Benefits Act' },
    { name: 'Interest on government bonds (3+ years, DSE-listed from 1 July 2021)', applicableTo: 'ALL', legalReference: 'Second Schedule, para 23', description: 'Government bonds with maturity ≥3 years listed on DSE from 1 July 2021' },
    { name: 'Gains from transfer of mineral rights to Govt-investor partnership', applicableTo: 'ALL', legalReference: 'Second Schedule, para 24', description: '' },
    { name: 'Gains from transfer of free carried interest shares to Government', applicableTo: 'ALL', legalReference: 'Second Schedule, para 25', description: '' },
    { name: 'Gains from transfer of shares to Government via Treasury Registrar', applicableTo: 'ALL', legalReference: 'Second Schedule, para 26', description: '' },
  ];
  for (const e of exemptAmounts) {
    await prisma.exemptAmount.create({ data: { isActive: true, conditions: null, ...e } });
  }
  console.log('Exempt amounts seeded (27 items from Second Schedule)');

  // ── TRANSLATIONS (EN baseline + SW) ──────────────────────────────────────
  await prisma.translation.deleteMany({});
  const translations: Array<{ language: string; key: string; value: string; category: string }> = [
    // Navigation
    { language: 'EN', key: 'nav.home',            value: 'Home',                  category: 'navigation' },
    { language: 'EN', key: 'nav.dashboard',        value: 'Dashboard',             category: 'navigation' },
    { language: 'EN', key: 'nav.calculators',      value: 'Calculators',           category: 'navigation' },
    { language: 'EN', key: 'nav.tools',            value: 'Tools',                 category: 'navigation' },
    { language: 'EN', key: 'nav.reports',          value: 'Reports',               category: 'navigation' },
    { language: 'EN', key: 'nav.admin',            value: 'Admin',                 category: 'navigation' },
    { language: 'EN', key: 'nav.login',            value: 'Login',                 category: 'navigation' },
    { language: 'EN', key: 'nav.register',         value: 'Register',              category: 'navigation' },
    { language: 'EN', key: 'nav.logout',           value: 'Logout',                category: 'navigation' },
    // Tax terms
    { language: 'EN', key: 'tax.employment_income', value: 'Employment Income',    category: 'tax_terms' },
    { language: 'EN', key: 'tax.business_income',   value: 'Business Income',      category: 'tax_terms' },
    { language: 'EN', key: 'tax.investment_income', value: 'Investment Income',    category: 'tax_terms' },
    { language: 'EN', key: 'tax.tax_payable',        value: 'Tax Payable',         category: 'tax_terms' },
    { language: 'EN', key: 'tax.taxable_income',     value: 'Taxable Income',      category: 'tax_terms' },
    { language: 'EN', key: 'tax.deductions',         value: 'Deductions',          category: 'tax_terms' },
    { language: 'EN', key: 'tax.exemptions',         value: 'Exemptions',          category: 'tax_terms' },
    { language: 'EN', key: 'tax.withholding_tax',    value: 'Withholding Tax',     category: 'tax_terms' },
    { language: 'EN', key: 'tax.vat',                value: 'Value Added Tax (VAT)',category: 'tax_terms' },
    { language: 'EN', key: 'tax.filing_deadline',    value: 'Filing Deadline',     category: 'tax_terms' },
    { language: 'EN', key: 'tax.penalty',            value: 'Penalty',             category: 'tax_terms' },
    { language: 'EN', key: 'tax.registration',       value: 'Tax Registration',    category: 'tax_terms' },
    { language: 'EN', key: 'tax.paye',               value: 'PAYE',                category: 'tax_terms' },
    { language: 'EN', key: 'tax.sdl',                value: 'Skills Development Levy', category: 'tax_terms' },
    { language: 'EN', key: 'tax.nssf',               value: 'NSSF Contribution',   category: 'tax_terms' },
    { language: 'EN', key: 'tax.gross_income',       value: 'Gross Income',        category: 'tax_terms' },
    { language: 'EN', key: 'tax.net_income',         value: 'Net Income',          category: 'tax_terms' },
    { language: 'EN', key: 'tax.effective_rate',     value: 'Effective Tax Rate',  category: 'tax_terms' },
    // Swahili translations
    { language: 'SW', key: 'nav.home',              value: 'Nyumbani',             category: 'navigation' },
    { language: 'SW', key: 'nav.dashboard',         value: 'Dashibodi',            category: 'navigation' },
    { language: 'SW', key: 'nav.calculators',       value: 'Mahesabu',             category: 'navigation' },
    { language: 'SW', key: 'nav.tools',             value: 'Zana',                 category: 'navigation' },
    { language: 'SW', key: 'nav.reports',           value: 'Ripoti',               category: 'navigation' },
    { language: 'SW', key: 'nav.admin',             value: 'Msimamizi',            category: 'navigation' },
    { language: 'SW', key: 'nav.login',             value: 'Ingia',                category: 'navigation' },
    { language: 'SW', key: 'nav.register',          value: 'Jiandikishe',          category: 'navigation' },
    { language: 'SW', key: 'nav.logout',            value: 'Toka',                 category: 'navigation' },
    { language: 'SW', key: 'tax.employment_income', value: 'Mapato ya ajira',      category: 'tax_terms' },
    { language: 'SW', key: 'tax.business_income',   value: 'Mapato ya biashara',   category: 'tax_terms' },
    { language: 'SW', key: 'tax.investment_income', value: 'Mapato ya uwekezaji',  category: 'tax_terms' },
    { language: 'SW', key: 'tax.tax_payable',       value: 'Kodi inayolipwa',      category: 'tax_terms' },
    { language: 'SW', key: 'tax.taxable_income',    value: 'Mapato yanayotozwa kodi', category: 'tax_terms' },
    { language: 'SW', key: 'tax.deductions',        value: 'Makato',               category: 'tax_terms' },
    { language: 'SW', key: 'tax.exemptions',        value: 'Msamaha wa kodi',      category: 'tax_terms' },
    { language: 'SW', key: 'tax.withholding_tax',   value: 'Kodi inayokatwa chanzo', category: 'tax_terms' },
    { language: 'SW', key: 'tax.vat',               value: 'Kodi ya Ongezeko la Thamani (VAT)', category: 'tax_terms' },
    { language: 'SW', key: 'tax.filing_deadline',   value: 'Tarehe ya mwisho ya kuwasilisha', category: 'tax_terms' },
    { language: 'SW', key: 'tax.penalty',           value: 'Faini',                category: 'tax_terms' },
    { language: 'SW', key: 'tax.registration',      value: 'Usajili wa kodi',      category: 'tax_terms' },
    { language: 'SW', key: 'tax.paye',              value: 'Kodi ya Mishahara (PAYE)', category: 'tax_terms' },
    { language: 'SW', key: 'tax.sdl',               value: 'Ushuru wa Ujuzi (SDL)', category: 'tax_terms' },
    { language: 'SW', key: 'tax.nssf',              value: 'Mchango wa NSSF',      category: 'tax_terms' },
    { language: 'SW', key: 'tax.gross_income',      value: 'Mapato ghafi',         category: 'tax_terms' },
    { language: 'SW', key: 'tax.net_income',        value: 'Mapato halisi',        category: 'tax_terms' },
    { language: 'SW', key: 'tax.effective_rate',    value: 'Kiwango halisi cha kodi', category: 'tax_terms' },

    // New module page titles (EN)
    { language: 'EN', key: 'page.vat_exempt_checker',    value: 'VAT Exempt Checker',            category: 'page_titles' },
    { language: 'EN', key: 'page.vat_refund',            value: 'VAT Refund Eligibility',        category: 'page_titles' },
    { language: 'EN', key: 'page.vat_tools',             value: 'VAT Special Tools',             category: 'page_titles' },
    { language: 'EN', key: 'page.digital_marketplace',   value: 'Digital Marketplace Tax',       category: 'page_titles' },
    { language: 'EN', key: 'page.filing_required',       value: 'Filing Required Checker',       category: 'page_titles' },
    { language: 'EN', key: 'page.filing_guide',          value: 'Return Filing Guide',           category: 'page_titles' },
    { language: 'EN', key: 'page.thin_cap',              value: 'Thin Capitalisation',           category: 'page_titles' },
    { language: 'EN', key: 'page.charitable_org',        value: 'Charitable Organisation',       category: 'page_titles' },
    { language: 'EN', key: 'page.clubs_associations',    value: 'Clubs & Trade Associations',    category: 'page_titles' },

    // New module UI labels (EN)
    { language: 'EN', key: 'vat.exempt',               value: 'Exempt',                         category: 'vat' },
    { language: 'EN', key: 'vat.zero_rated',           value: 'Zero-Rated',                     category: 'vat' },
    { language: 'EN', key: 'vat.taxable',              value: 'Taxable',                        category: 'vat' },
    { language: 'EN', key: 'vat.bad_debt',             value: 'Bad Debt Adjustment',            category: 'vat' },
    { language: 'EN', key: 'vat.going_concern',        value: 'Going Concern',                  category: 'vat' },
    { language: 'EN', key: 'vat.lay_by',               value: 'Lay-By Sale',                    category: 'vat' },
    { language: 'EN', key: 'vat.connected_persons',    value: 'Connected Persons',              category: 'vat' },
    { language: 'EN', key: 'vat.adjustment_event',     value: 'Adjustment Event',               category: 'vat' },
    { language: 'EN', key: 'vat.pricing_tool',         value: 'VAT Pricing Tool',               category: 'vat' },
    { language: 'EN', key: 'vat.refund_eligibility',   value: 'Refund Eligibility',             category: 'vat' },
    { language: 'EN', key: 'digital.tax_rate',         value: 'Digital Marketplace Tax Rate',   category: 'digital' },
    { language: 'EN', key: 'digital.filing_deadline',  value: 'Filing Deadline',                category: 'digital' },
    { language: 'EN', key: 'filing.individual',        value: 'Individual',                     category: 'filing' },
    { language: 'EN', key: 'filing.company',           value: 'Company',                        category: 'filing' },
    { language: 'EN', key: 'filing.partnership',       value: 'Partnership',                    category: 'filing' },
    { language: 'EN', key: 'filing.deadline',          value: 'Deadline',                       category: 'filing' },
    { language: 'EN', key: 'filing.checklist',         value: 'Filing Checklist',               category: 'filing' },
    { language: 'EN', key: 'thin_cap.debt_equity',     value: 'Debt to Equity Ratio',           category: 'thin_cap' },
    { language: 'EN', key: 'thin_cap.interest_denied', value: 'Interest Denied (Non-Deductible)',category: 'thin_cap' },

    // New module page titles (SW - Swahili)
    { language: 'SW', key: 'page.vat_exempt_checker',    value: 'Kagua Msamaha wa VAT',         category: 'page_titles' },
    { language: 'SW', key: 'page.vat_refund',            value: 'Kustahili Kurejeshesha VAT',   category: 'page_titles' },
    { language: 'SW', key: 'page.vat_tools',             value: 'Zana Maalum za VAT',           category: 'page_titles' },
    { language: 'SW', key: 'page.digital_marketplace',   value: 'Kodi ya Soko la Dijitali',     category: 'page_titles' },
    { language: 'SW', key: 'page.filing_required',       value: 'Je, Ninapaswa Kuwasilisha?',   category: 'page_titles' },
    { language: 'SW', key: 'page.filing_guide',          value: 'Mwongozo wa Kuwasilisha Mapato', category: 'page_titles' },
    { language: 'SW', key: 'page.thin_cap',              value: 'Uwiano wa Mtaji na Madeni',    category: 'page_titles' },
    { language: 'SW', key: 'page.charitable_org',        value: 'Shirika la Hisani',            category: 'page_titles' },
    { language: 'SW', key: 'page.clubs_associations',    value: 'Vilabu na Vyama vya Biashara', category: 'page_titles' },

    // New module UI labels (SW)
    { language: 'SW', key: 'vat.exempt',               value: 'Msamaha',                        category: 'vat' },
    { language: 'SW', key: 'vat.zero_rated',           value: 'Kiwango Sifuri',                 category: 'vat' },
    { language: 'SW', key: 'vat.taxable',              value: 'Inayotozwa Kodi',                category: 'vat' },
    { language: 'SW', key: 'vat.bad_debt',             value: 'Marekebisho ya Deni Baya',       category: 'vat' },
    { language: 'SW', key: 'vat.going_concern',        value: 'Uhamisho wa Shughuli Inayoendelea', category: 'vat' },
    { language: 'SW', key: 'vat.lay_by',               value: 'Uuzaji kwa Malipo ya Awali',     category: 'vat' },
    { language: 'SW', key: 'vat.connected_persons',    value: 'Watu Wanaohusiana',              category: 'vat' },
    { language: 'SW', key: 'vat.adjustment_event',     value: 'Tukio la Marekebisho',           category: 'vat' },
    { language: 'SW', key: 'vat.pricing_tool',         value: 'Zana ya Bei ya VAT',             category: 'vat' },
    { language: 'SW', key: 'vat.refund_eligibility',   value: 'Kustahili Kurejeshesha',         category: 'vat' },
    { language: 'SW', key: 'digital.tax_rate',         value: 'Kiwango cha Kodi ya Dijitali',   category: 'digital' },
    { language: 'SW', key: 'digital.filing_deadline',  value: 'Tarehe ya Mwisho',              category: 'digital' },
    { language: 'SW', key: 'filing.individual',        value: 'Mtu Binafsi',                   category: 'filing' },
    { language: 'SW', key: 'filing.company',           value: 'Kampuni',                       category: 'filing' },
    { language: 'SW', key: 'filing.partnership',       value: 'Ushirikiano',                   category: 'filing' },
    { language: 'SW', key: 'filing.deadline',          value: 'Tarehe ya Mwisho',              category: 'filing' },
    { language: 'SW', key: 'filing.checklist',         value: 'Orodha ya Uwasilishaji',        category: 'filing' },
    { language: 'SW', key: 'thin_cap.debt_equity',     value: 'Uwiano wa Deni na Mtaji',       category: 'thin_cap' },
    { language: 'SW', key: 'thin_cap.interest_denied', value: 'Riba Isiyoruhusiwa',            category: 'thin_cap' },
  ];
  for (const t of translations) {
    await prisma.translation.upsert({
      where: { language_key: { language: t.language, key: t.key } },
      update: { value: t.value },
      create: t,
    });
  }
  console.log('Translations seeded (EN + SW)');

  console.log('\nDatabase seeded successfully!');
  console.log('Admin login: admin@kodicomply.co.tz / Admin@KodiComply2024');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
