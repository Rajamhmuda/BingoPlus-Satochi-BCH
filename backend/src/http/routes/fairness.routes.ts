import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getOrCreateActiveEpoch, deriveFairOutcome } from '../../services/fairness.service.js';
import { adminDb } from '../../auth/firebase-admin.js';

const router = Router();

/**
 * GET /api/v1/fairness/current
 * Returns active fairness seed hash
 */
router.get('/current', async (_req: Request, res: Response): Promise<void> => {
  try {
    const epoch = await getOrCreateActiveEpoch();
    res.json({
      success: true,
      data: {
        epochId: epoch.epochId,
        serverSeedHash: epoch.serverSeedHash,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fairness info: ' + error.message });
  }
});

/**
 * GET /api/v1/fairness/epochs/:epochId
 */
router.get('/epochs/:epochId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { epochId } = req.params;
    const snap = await adminDb.ref(`public/fairnessEpochs/${epochId}`).once('value');

    if (!snap.exists()) {
      res.status(404).json({ error: 'Fairness epoch not found' });
      return;
    }

    res.json({ success: true, data: snap.val() });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch epoch: ' + error.message });
  }
});

/**
 * POST /api/v1/fairness/verify
 * Public verification endpoint
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { serverSeed, clientSeed, nonce, gameId } = req.body;

    if (!serverSeed || !clientSeed || nonce === undefined || !gameId) {
      res.status(400).json({ error: 'Missing required parameters: serverSeed, clientSeed, nonce, gameId' });
      return;
    }

    const computedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    const outcome = deriveFairOutcome(serverSeed, clientSeed, Number(nonce), gameId);

    res.json({
      success: true,
      data: {
        serverSeed,
        serverSeedHash: computedHash,
        clientSeed,
        nonce: Number(nonce),
        gameId,
        hmacHex: outcome.hmacHex,
        floatValue: outcome.floatValue,
        intValue: outcome.intValue,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Verification failed: ' + error.message });
  }
});

export default router;
