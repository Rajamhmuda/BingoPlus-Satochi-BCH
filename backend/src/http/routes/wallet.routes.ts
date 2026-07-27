import { Router, Request, Response } from 'express';
import { requireAuth } from '../../auth/require-auth.js';
import { syncUserDeposits, executeWithdrawal } from '../../services/wallet.service.js';
import { adminDb } from '../../auth/firebase-admin.js';

const router = Router();

/**
 * GET /api/v1/wallet
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const [walletSnap, balanceSnap] = await Promise.all([
      adminDb.ref(`walletsPublic/${uid}`).once('value'),
      adminDb.ref(`accounts/${uid}/balance`).once('value'),
    ]);

    res.json({
      success: true,
      data: {
        address: walletSnap.exists() ? walletSnap.val().address : null,
        network: 'chipnet',
        balance: balanceSnap.exists() ? balanceSnap.val() : {},
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch wallet info: ' + error.message });
  }
});

/**
 * POST /api/v1/wallet/sync-deposits
 */
router.post('/sync-deposits', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const result = await syncUserDeposits(uid);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Deposit sync failed: ' + error.message });
  }
});

/**
 * GET /api/v1/wallet/ledger
 */
router.get('/ledger', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const snap = await adminDb.ref(`userLedger/${uid}`).orderByChild('createdAt').limitToLast(50).once('value');

    const ledger: any[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        ledger.unshift({ id: child.key, ...child.val() });
      });
    }

    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch ledger: ' + error.message });
  }
});

/**
 * POST /api/v1/wallet/withdrawals
 */
router.post('/withdrawals', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const { destination, amountSats } = req.body;

    const result = await executeWithdrawal(uid, destination, Number(amountSats));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Withdrawal failed' });
  }
});

/**
 * GET /api/v1/wallet/withdrawals
 */
router.get('/withdrawals', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const snap = await adminDb.ref('chain/withdrawals').orderByChild('uid').equalTo(uid).limitToLast(20).once('value');

    const withdrawals: any[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        withdrawals.unshift({ id: child.key, ...child.val() });
      });
    }

    res.json({ success: true, data: withdrawals });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch withdrawals: ' + error.message });
  }
});

export default router;
