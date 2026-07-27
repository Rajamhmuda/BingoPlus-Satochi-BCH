import { Router, Request, Response } from 'express';
import { requireAuth } from '../../auth/require-auth.js';
import { bootstrapUserAccount } from '../../services/account-bootstrap.service.js';

const router = Router();

/**
 * POST /api/v1/auth/bootstrap
 * Idempotent account initialization endpoint
 */
router.post('/bootstrap', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@guest.com`;
    const displayName = req.body?.displayName || req.user?.name;

    const result = await bootstrapUserAccount(uid, email, displayName);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in /auth/bootstrap:', error);
    res.status(500).json({ error: 'Failed to bootstrap account: ' + (error.message || 'Unknown error') });
  }
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated user state
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@guest.com`;

    const result = await bootstrapUserAccount(uid, email);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user state: ' + error.message });
  }
});

export default router;
