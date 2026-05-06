import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../lib/email';

const router = Router();

const SITE_URL     = process.env.FRONTEND_URL  || 'http://localhost:3000';
const VERIFY_HOURS = 24;

function makeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── Register ──────────────────────────────────────────────────────────────────

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed    = await bcrypt.hash(password, 12);
    const verToken  = makeToken();
    const verExpiry = new Date(Date.now() + VERIFY_HOURS * 3600000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        emailVerificationToken:  verToken,
        emailVerificationExpiry: verExpiry,
      },
      select: { id: true, name: true, email: true, role: true, isEmailVerified: true, createdAt: true },
    });

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Send verification email (fire-and-forget — never block registration)
    sendEmail({
      to:           email,
      templateSlug: 'email_verification',
      vars: {
        userName:  name,
        verifyUrl: `${SITE_URL}/verify-email?token=${verToken}`,
        siteUrl:   SITE_URL,
      },
    }).catch(err => console.error('[auth] Failed to send verification email:', err));

    res.status(201).json({ token: jwtToken, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id:               user.id,
        name:             user.name,
        email:            user.email,
        role:             user.role,
        isEmailVerified:  user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Verify email ──────────────────────────────────────────────────────────────

router.get('/verify-email', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as { token: string };
  if (!token) {
    res.status(400).json({ error: 'Token required' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken:  token,
      emailVerificationExpiry: { gt: new Date() },
      isEmailVerified:         false,
    },
  });

  if (!user) {
    res.status(400).json({ error: 'Invalid or expired verification link' });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified:         true,
      emailVerificationToken:  null,
      emailVerificationExpiry: null,
    },
  });

  // Send welcome email
  sendEmail({
    to:           user.email,
    templateSlug: 'welcome',
    vars: {
      userName: user.name,
      loginUrl: `${SITE_URL}/dashboard`,
      siteUrl:  SITE_URL,
    },
  }).catch(err => console.error('[auth] Failed to send welcome email:', err));

  res.json({ success: true, message: 'Email verified successfully' });
});

// ── Resend verification ───────────────────────────────────────────────────────

router.post('/resend-verification', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.isEmailVerified) {
    res.status(400).json({ error: 'Email already verified' });
    return;
  }

  const verToken  = makeToken();
  const verExpiry = new Date(Date.now() + VERIFY_HOURS * 3600000);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken: verToken, emailVerificationExpiry: verExpiry },
  });

  await sendEmail({
    to:           user.email,
    templateSlug: 'email_verification',
    vars: {
      userName:  user.name,
      verifyUrl: `${SITE_URL}/verify-email?token=${verToken}`,
      siteUrl:   SITE_URL,
    },
  }).catch(err => console.error('[auth] Failed to resend verification email:', err));

  res.json({ success: true, message: 'Verification email sent' });
});

// ── Me ────────────────────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, isEmailVerified: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
