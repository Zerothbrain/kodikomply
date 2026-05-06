import prisma from '../lib/prisma';

export interface ProfileInput {
  entityType: string;
  activityTypes: string[];
  residentStatus: string;
  hasEmployees: boolean;
  turnoverBand: string;
}

export interface ApplicableModule {
  key: string;
  label: string;
  status: 'required' | 'applicable' | 'watch' | 'not_applicable';
  note: string;
  deadlineNote: string;
  href: string;
  priority: number;
}

export function determineModules(input: ProfileInput): ApplicableModule[] {
  const { entityType, activityTypes, residentStatus, hasEmployees, turnoverBand } = input;

  const isEmployed   = activityTypes.includes('EMPLOYED') || activityTypes.includes('BOTH');
  const hasBusiness  = activityTypes.includes('BUSINESS') || activityTypes.includes('BOTH') || activityTypes.includes('FREELANCER');
  const isInvestor   = activityTypes.includes('INVESTOR');
  const isRetired    = activityTypes.includes('RETIRED');
  const isCompany    = entityType === 'COMPANY';
  const isPartnership= entityType === 'PARTNERSHIP';
  const isNGO        = entityType === 'NGO';
  const isResident   = residentStatus === 'RESIDENT' || residentStatus === 'GOVERNMENT';
  const isGovEmployee= residentStatus === 'GOVERNMENT';

  const above200M    = turnoverBand === 'ABOVE_200M';
  const above100M    = turnoverBand === 'ABOVE_200M' || turnoverBand === '100M_200M';
  const above4M      = turnoverBand !== 'BELOW_4M';

  const modules: ApplicableModule[] = [];

  // ── PAYE as employee ────────────────────────────────────────────────────────
  if (isEmployed) {
    modules.push({
      key: 'paye_employee', priority: 1,
      label: 'PAYE (as employee)',
      status: 'applicable',
      note: 'Your employer withholds PAYE and remits monthly. Check whether you need to file an annual return.',
      deadlineNote: 'Monthly — employer files by 7th',
      href: '/calculator/employment',
    });
  }

  // ── PAYE as employer ────────────────────────────────────────────────────────
  if (hasEmployees) {
    modules.push({
      key: 'paye_employer', priority: 2,
      label: 'PAYE — as Employer',
      status: 'required',
      note: 'Deduct PAYE from employee salaries every month and remit to TRA.',
      deadlineNote: 'Monthly — 7th of following month',
      href: '/calculator/employment',
    });
    modules.push({
      key: 'sdl', priority: 3,
      label: 'Skills Development Levy (SDL)',
      status: 'required',
      note: '4.5% of gross monthly payroll remitted to TRA alongside PAYE.',
      deadlineNote: 'Monthly — 7th of following month',
      href: '/calculator/employment',
    });
  }

  // ── VAT ─────────────────────────────────────────────────────────────────────
  if (above200M) {
    modules.push({
      key: 'vat', priority: 4,
      label: 'VAT Registration & Returns',
      status: 'required',
      note: 'Turnover exceeds TZS 200M — VAT registration is MANDATORY. Monthly returns required.',
      deadlineNote: 'Monthly — 20th of following month',
      href: '/calculator/vat',
    });
  } else if (above100M) {
    modules.push({
      key: 'vat', priority: 4,
      label: 'VAT — Approaching Threshold',
      status: 'watch',
      note: 'Turnover TZS 100M–200M. Monitor closely — if you exceed TZS 200M in any 12-month period, registration becomes mandatory within 30 days.',
      deadlineNote: 'Register within 30 days of exceeding TZS 200M',
      href: '/calculator/vat',
    });
  } else {
    modules.push({
      key: 'vat', priority: 4,
      label: 'VAT Registration',
      status: 'not_applicable',
      note: 'Not required — turnover is below TZS 200M threshold. Voluntary registration is possible.',
      deadlineNote: 'N/A',
      href: '/calculator/vat',
    });
  }

  // ── Presumptive tax ─────────────────────────────────────────────────────────
  if (!isCompany && !isPartnership && !isNGO && hasBusiness && !above100M) {
    modules.push({
      key: 'presumptive', priority: 5,
      label: 'Presumptive Tax (Small Business)',
      status: above4M ? 'required' : 'not_applicable',
      note: above4M
        ? 'Annual tax on turnover. Rate depends on compliance with S.43 TAA record-keeping.'
        : 'Turnover below TZS 4M — NIL presumptive tax due.',
      deadlineNote: 'Annual — June 30',
      href: '/calculator/presumptive',
    });
  }

  // ── Business / Corporate income tax ─────────────────────────────────────────
  if (isCompany) {
    modules.push({
      key: 'corporate', priority: 6,
      label: 'Corporate Income Tax (30%)',
      status: 'required',
      note: 'Standard rate 30% on net profit. Quarterly installment payments required.',
      deadlineNote: 'Annual return — June 30',
      href: '/calculator/corporate',
    });
    modules.push({
      key: 'quarterly', priority: 7,
      label: 'Quarterly Tax Installments',
      status: 'required',
      note: '4 installments based on estimated tax. Calculated from prior year tax.',
      deadlineNote: 'Q1: Mar 31 · Q2: Jun 30 · Q3: Sep 30 · Q4: Dec 31',
      href: '/calculator/corporate',
    });
  } else if (isPartnership) {
    modules.push({
      key: 'partnership', priority: 6,
      label: 'Partnership Taxation (S.48 ITA)',
      status: 'required',
      note: 'Partnership is transparent — no entity-level tax. Income allocated to partners and taxed in their hands.',
      deadlineNote: 'Partners file individual returns by June 30',
      href: '/calculator/partnership',
    });
  } else if (hasBusiness && above100M) {
    modules.push({
      key: 'business', priority: 6,
      label: 'Business Income Tax',
      status: 'required',
      note: 'Business income above TZS 100M — taxed at progressive rates as individual business income.',
      deadlineNote: 'Annual — June 30',
      href: '/calculator/business',
    });
  }

  // ── WHT on payments ─────────────────────────────────────────────────────────
  if (hasBusiness || isCompany || hasEmployees || isPartnership) {
    modules.push({
      key: 'wht', priority: 8,
      label: 'Withholding Tax (WHT)',
      status: 'applicable',
      note: 'Withhold and remit WHT on payments to contractors, rent, dividends, royalties, and professional fees.',
      deadlineNote: 'Monthly — 7th of following month',
      href: '/calculator/withholding',
    });
  }

  // ── WHT credits ─────────────────────────────────────────────────────────────
  if (hasBusiness && !isCompany) {
    modules.push({
      key: 'wht_credits', priority: 9,
      label: 'WHT Credits (Income Received)',
      status: 'applicable',
      note: 'WHT deducted from payments received to you can be claimed as a credit against your income tax liability.',
      deadlineNote: 'Claim in annual return — June 30',
      href: '/calculator/withholding',
    });
  }

  // ── Investment income ────────────────────────────────────────────────────────
  if (isInvestor || isRetired) {
    modules.push({
      key: 'investment', priority: 10,
      label: 'Investment Income Tax',
      status: 'applicable',
      note: 'Dividends, interest, capital gains, rental income — various rates apply. DSE exemptions available.',
      deadlineNote: 'Reported in annual return — June 30',
      href: '/calculator/investment',
    });
  }

  // ── NGO ──────────────────────────────────────────────────────────────────────
  if (isNGO) {
    modules.push({
      key: 'charitable', priority: 6,
      label: 'Charitable Organisation (S.64 ITA)',
      status: 'applicable',
      note: 'Registered charities may deduct up to 25% of charitable business income. Business income from unrelated activities is taxable.',
      deadlineNote: 'Annual — June 30',
      href: '/calculator/business',
    });
  }

  // ── Annual income tax return ─────────────────────────────────────────────────
  const needsReturn = isResident && (isEmployed || hasBusiness || isInvestor || isCompany || isPartnership);
  const caseA = isEmployed && !hasBusiness && !isInvestor; // only PAYE income → may be exempt from filing
  if (needsReturn) {
    modules.push({
      key: 'annual_return', priority: 11,
      label: 'Annual Income Tax Return (S.117 ITA)',
      status: caseA ? 'watch' : 'required',
      note: caseA
        ? 'You may be exempt if all tax was withheld via PAYE and total income < threshold. Use the filing checker to confirm.'
        : 'Annual return must be filed by June 30. Late filing penalty: TZS 225,000/month (individual) or TZS 7,500,000/month (entity).',
      deadlineNote: 'June 30 each year',
      href: '/guide/filing-return',
    });
  }

  // ── Non-resident WHT ────────────────────────────────────────────────────────
  if (!isResident && (hasBusiness || isInvestor)) {
    modules.push({
      key: 'nonresident_wht', priority: 12,
      label: 'Non-Resident WHT (Final Tax)',
      status: 'applicable',
      note: 'Tanzanian-source income is subject to WHT as final tax for non-residents. No separate return required.',
      deadlineNote: 'Withheld at source by Tanzanian payer',
      href: '/calculator/withholding',
    });
  }

  // ── Digital marketplace ──────────────────────────────────────────────────────
  if (!isResident && hasBusiness) {
    modules.push({
      key: 'digital_marketplace', priority: 13,
      label: 'Digital Marketplace Tax (S.116 ITA)',
      status: 'applicable',
      note: '2% of gross payments from Tanzania individuals for electronic services. Self-assessed.',
      deadlineNote: 'Monthly — 20th of following month',
      href: '/calculator/digital-marketplace',
    });
  }

  // ── Filing required checker ──────────────────────────────────────────────────
  if (isEmployed && !hasBusiness) {
    modules.push({
      key: 'filing_check', priority: 14,
      label: 'Do I Need to File a Return?',
      status: 'watch',
      note: 'Employed individuals whose only income is PAYE salary may be exempt from filing under Case A or Case B.',
      deadlineNote: 'Check before June 30',
      href: '/calculator/filing-required',
    });
  }

  return modules.sort((a, b) => a.priority - b.priority);
}

export async function getProfile(userId: number) {
  const profile = await prisma.userTaxProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  return {
    ...profile,
    activityTypes: JSON.parse(profile.activityTypes) as string[],
    applicableModules: JSON.parse(profile.applicableModules) as ApplicableModule[],
    completedModules: JSON.parse(profile.completedModules) as string[],
    moduleData: JSON.parse(profile.moduleData) as Record<string, unknown>,
  };
}

export async function saveProfile(userId: number, input: ProfileInput) {
  const modules = determineModules(input);
  const data = {
    userId,
    entityType: input.entityType,
    activityTypes: JSON.stringify(input.activityTypes),
    residentStatus: input.residentStatus,
    hasEmployees: input.hasEmployees,
    turnoverBand: input.turnoverBand,
    applicableModules: JSON.stringify(modules),
  };
  return prisma.userTaxProfile.upsert({
    where: { userId },
    update: { ...data, completedModules: '[]', moduleData: '{}' },
    create: { ...data },
  });
}

export async function markModuleComplete(userId: number, moduleKey: string, data: Record<string, unknown>) {
  const profile = await prisma.userTaxProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('No profile found');

  const completed: string[] = JSON.parse(profile.completedModules);
  const moduleData: Record<string, unknown> = JSON.parse(profile.moduleData);

  if (!completed.includes(moduleKey)) completed.push(moduleKey);
  moduleData[moduleKey] = data;

  return prisma.userTaxProfile.update({
    where: { userId },
    data: {
      completedModules: JSON.stringify(completed),
      moduleData: JSON.stringify(moduleData),
    },
  });
}
