import { Router, Request, Response } from 'express';
import { requireAuth } from '../../auth/require-auth.js';
import { adminDb } from '../../auth/firebase-admin.js';

const router = Router();

router.use(requireAuth);

/**
 * GET /api/v1/profile
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const snap = await adminDb.ref(`users/${uid}`).once('value');

    if (!snap.exists()) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ success: true, data: snap.val() });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile: ' + error.message });
  }
});

/**
 * POST /api/v1/profile/self-exclude
 */
router.post('/self-exclude', async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const { durationDays } = req.body;

    const days = Math.max(1, Math.min(365, Number(durationDays) || 7));
    const until = Date.now() + days * 24 * 60 * 60 * 1000;

    await adminDb.ref(`users/${uid}/responsibleGaming`).update({
      selfExcludedUntil: until,
      updatedAt: Date.now(),
    });

    res.json({ success: true, message: `Account self-excluded for ${days} days until ${new Date(until).toISOString()}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Self exclusion failed: ' + error.message });
  }
});

/**
 * POST /api/v1/profile/play-limits
 */
router.post('/play-limits', async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const { maxBetSats, dailyLossLimitSats } = req.body;

    const updates: any = {};
    if (maxBetSats !== undefined) updates.maxBetSats = Math.max(100, Number(maxBetSats));
    if (dailyLossLimitSats !== undefined) updates.dailyLossLimitSats = Math.max(1000, Number(dailyLossLimitSats));
    updates.updatedAt = Date.now();

    await adminDb.ref(`users/${uid}/responsibleGaming`).update(updates);

    res.json({ success: true, message: 'Play limits updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update play limits: ' + error.message });
  }
});

export default router;
