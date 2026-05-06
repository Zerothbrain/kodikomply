import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, saveProfile, markModuleComplete } from '../controllers/profile';

const router = Router();

// GET /api/profile — get current user's tax profile
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user: { id: number } }).user.id;
    const profile = await getProfile(userId);
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// POST /api/profile — create or update profile (re-runs module determination)
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user: { id: number } }).user.id;
    const { entityType, activityTypes, residentStatus, hasEmployees, turnoverBand } = req.body;
    if (!entityType || !activityTypes || !residentStatus || turnoverBand === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    await saveProfile(userId, { entityType, activityTypes, residentStatus, hasEmployees: !!hasEmployees, turnoverBand });
    const profile = await getProfile(userId);
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// PATCH /api/profile/module/:key — mark a module as completed
router.patch('/module/:key', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user: { id: number } }).user.id;
    await markModuleComplete(userId, req.params.key, req.body ?? {});
    const profile = await getProfile(userId);
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Failed to update module' });
  }
});

// DELETE /api/profile — reset profile (re-run wizard)
router.delete('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user: { id: number } }).user.id;
    const prisma = (await import('../lib/prisma')).default;
    await prisma.userTaxProfile.delete({ where: { userId } }).catch(() => {});
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to reset profile' });
  }
});

export default router;
