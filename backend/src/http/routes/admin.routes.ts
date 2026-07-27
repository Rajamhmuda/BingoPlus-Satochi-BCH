import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../../auth/require-auth.js';
import { adminDb } from '../../auth/firebase-admin.js';
import { createNewFairnessEpoch } from '../../services/fairness.service.js';

const router = Router();

router.use(requireAuth, requireAdmin);

/**
 * GET /api/v1/admin/dashboard
 */
router.get('/dashboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [systemSnap, usersSnap, betsSnap, withdrawalsSnap] = await Promise.all([
      adminDb.ref('public/system').once('value'),
      adminDb.ref('users').once('value'),
      adminDb.ref('public/recentBets').limitToLast(100).once('value'),
      adminDb.ref('chain/withdrawals').limitToLast(100).once('value'),
    ]);

    const system = systemSnap.exists() ? systemSnap.val() : { bettingEnabled: true };
    const totalUsers = usersSnap.exists() ? usersSnap.numChildren() : 0;
    const totalBets = betsSnap.exists() ? betsSnap.numChildren() : 0;
    const totalWithdrawals = withdrawalsSnap.exists() ? withdrawalsSnap.numChildren() : 0;

    res.json({
      success: true,
      data: {
        bettingEnabled: system.bettingEnabled ?? true,
        maintenanceMessage: system.maintenanceMessage || null,
        totalUsers,
        totalBets,
        totalWithdrawals,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin dashboard: ' + error.message });
  }
});

/**
 * POST /api/v1/admin/system/pause
 */
router.post('/system/pause', async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled, message } = req.body;
    await adminDb.ref('public/system').update({
      bettingEnabled: Boolean(enabled),
      maintenanceMessage: message || null,
      updatedAt: Date.now(),
    });

    res.json({ success: true, message: `Global betting set to ${enabled}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update system state: ' + error.message });
  }
});

/**
 * POST /api/v1/admin/games/:gameId/toggle
 */
router.post('/games/:gameId/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const { enabled } = req.body;

    await adminDb.ref(`public/games/${gameId}`).update({
      enabled: Boolean(enabled),
      updatedAt: Date.now(),
    });

    res.json({ success: true, message: `Game ${gameId} enabled set to ${enabled}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle game: ' + error.message });
  }
});

/**
 * POST /api/v1/admin/fairness/rotate
 */
router.post('/fairness/rotate', async (_req: Request, res: Response): Promise<void> => {
  try {
    const newEpoch = await createNewFairnessEpoch();
    res.json({
      success: true,
      message: 'Server seed rotated successfully',
      data: {
        newEpochId: newEpoch.epochId,
        newServerSeedHash: newEpoch.serverSeedHash,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to rotate seed: ' + error.message });
  }
});

export default router;
