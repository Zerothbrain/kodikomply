import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import {
  handleChat,
  getChatSessions,
  getChatSession,
  getChatUsage,
  getAdminChatStats,
  getAdminChatSessions,
  getSystemPrompts,
  createSystemPrompt,
  activateSystemPrompt,
  getDefaultLimit,
  updateDefaultLimit,
  setUserChatLimit,
} from '../controllers/chat';

const router = Router();

// User endpoints
router.post('/', authenticate, handleChat);
router.get('/sessions', authenticate, getChatSessions);
router.get('/sessions/:id', authenticate, getChatSession);
router.get('/usage', authenticate, getChatUsage);

// Admin endpoints
router.get('/admin/stats', authenticate, adminOnly, getAdminChatStats);
router.get('/admin/sessions', authenticate, adminOnly, getAdminChatSessions);
router.get('/admin/prompts', authenticate, adminOnly, getSystemPrompts);
router.post('/admin/prompts', authenticate, adminOnly, createSystemPrompt);
router.put('/admin/prompts/:id/activate', authenticate, adminOnly, activateSystemPrompt);
router.get('/admin/limit', authenticate, adminOnly, getDefaultLimit);
router.put('/admin/limit', authenticate, adminOnly, updateDefaultLimit);
router.put('/admin/limit/:userId', authenticate, adminOnly, setUserChatLimit);

export default router;
