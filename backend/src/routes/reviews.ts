import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Public: get published reviews
router.get('/', async (_req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, role: true, rating: true, comment: true, createdAt: true },
  });
  res.json(reviews);
});

// Authenticated: submit a review (one pending review per user at a time)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, role, rating, comment } = req.body as {
    name: string; role?: string; rating: number; comment: string;
  };

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  if (!comment || comment.trim().length < 10) {
    res.status(400).json({ error: 'Comment must be at least 10 characters' });
    return;
  }
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5' });
    return;
  }

  const review = await prisma.review.create({
    data: {
      userId: req.user!.id,
      name: name.trim(),
      role: role?.trim() || null,
      rating: Math.round(rating),
      comment: comment.trim(),
      isPublished: false,
    },
  });
  res.status(201).json({ message: 'Review submitted. It will appear after admin approval.', id: review.id });
});

// Admin: list all reviews
router.get('/admin', authenticate, adminOnly, async (_req: AuthRequest, res: Response) => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, name: true } } },
  });
  res.json(reviews);
});

// Admin: publish a review
router.put('/admin/:id/publish', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const review = await prisma.review.update({ where: { id }, data: { isPublished: true } });
  res.json(review);
});

// Admin: unpublish
router.put('/admin/:id/unpublish', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const review = await prisma.review.update({ where: { id }, data: { isPublished: false } });
  res.json(review);
});

// Admin: delete
router.delete('/admin/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  await prisma.review.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
