import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../../auth/require-auth.js';
import { createOnChainAuditAnchor } from '../../blockchain/audit-anchor.service.js';
import { getJackpotVaultInfo } from '../../blockchain/treasury.service.js';
import { adminDb } from '../../auth/firebase-admin.js';

const router = Router();

/**
 * GET /api/v1/audit/anchors
 * Public endpoint to list on-chain OP_RETURN audit records
 */
router.get('/anchors', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await adminDb.ref('public/onchainAnchors').limitToLast(20).once('value');
    const anchors: any[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        anchors.unshift({ id: child.key, ...child.val() });
      });
    }
    res.json({ success: true, data: anchors });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit anchors: ' + error.message });
  }
});

/**
 * GET /api/v1/audit/treasury
 * Public endpoint returning CashScript Jackpot Vault smart contract info
 */
router.get('/treasury', async (_req: Request, res: Response): Promise<void> => {
  try {
    const treasuryInfo = getJackpotVaultInfo();
    res.json({ success: true, data: treasuryInfo });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch treasury info: ' + error.message });
  }
});

/**
 * POST /api/v1/audit/anchor-now
 * Admin endpoint to manually broadcast an OP_RETURN audit anchor
 */
router.post('/anchor-now', requireAuth, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const record = await createOnChainAuditAnchor();
    res.json({ success: true, data: record, message: 'On-chain OP_RETURN audit anchor broadcasted to Chipnet!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Audit anchor failed: ' + error.message });
  }
});

export default router;
