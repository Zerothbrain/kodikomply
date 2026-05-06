import prisma from './prisma';

export async function getPAYEBandsPublic(): Promise<Array<{ min: number; max: number | null; rate: number }>> {
  const rules = await prisma.taxRule.findMany({
    where: { category: 'PAYE_BAND', isActive: true },
    orderBy: { minValue: 'asc' },
  });
  return rules.map(r => ({
    min: Number(r.minValue ?? 0),
    max: r.maxValue ? Number(r.maxValue) : null,
    rate: Number(r.rate ?? 0),
  }));
}
