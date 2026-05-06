import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const deadlines = await prisma.filingDeadline.findMany({
      where: { isActive: true },
      orderBy: { taxType: 'asc' },
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const enriched = deadlines.map(d => {
      let dueDate: Date;
      if (d.dueMonth) {
        dueDate = new Date(currentYear, d.dueMonth - 1, d.dueDayOfMonth);
        if (dueDate < now) dueDate.setFullYear(currentYear + 1);
      } else {
        // Monthly — next occurrence
        dueDate = new Date(currentYear, currentMonth - 1, d.dueDayOfMonth);
        if (dueDate < now) {
          dueDate = new Date(currentYear, currentMonth, d.dueDayOfMonth);
        }
      }
      const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...d,
        nextDueDate: dueDate.toISOString().split('T')[0],
        daysRemaining,
        isUrgent: daysRemaining <= d.reminderDays,
      };
    });

    res.json(enriched.sort((a, b) => a.daysRemaining - b.daysRemaining));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

export default router;
