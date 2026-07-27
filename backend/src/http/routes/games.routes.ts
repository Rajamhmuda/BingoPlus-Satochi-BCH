import { Router, Request, Response } from 'express';
import { requireAuth } from '../../auth/require-auth.js';
import { processBet } from '../../services/bet-engine.service.js';
import { diceGame } from '../../games/dice.game.js';
import { slotsGame } from '../../games/slots.game.js';
import { startMinesGame, revealMinesTile, cashoutMinesGame } from '../../games/mines.game.js';
import { adminDb } from '../../auth/firebase-admin.js';

const router = Router();

/**
 * GET /api/v1/games
 * List available games and active config
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const snap = await adminDb.ref('public/games').once('value');
    const games = snap.exists()
      ? snap.val()
      : {
          dice: { name: 'Satoshi Dice', enabled: true, minBetSats: 100, maxBetSats: 5000 },
          slots: { name: 'Meme Slots', enabled: true, minBetSats: 100, maxBetSats: 5000 },
          mines: { name: 'Chipnet Mines', enabled: true, minBetSats: 100, maxBetSats: 5000 },
        };
    res.json({ success: true, data: games });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch games: ' + error.message });
  }
});

/**
 * POST /api/v1/games/dice/play
 */
router.post('/dice/play', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const { wagerSats, target, direction, clientSeed, idempotencyKey } = req.body;

    const result = await processBet({
      uid,
      gameAdapter: diceGame,
      input: {
        wagerSats: Number(wagerSats),
        target: Number(target),
        direction,
        clientSeed,
        idempotencyKey: idempotencyKey || `dice_${Date.now()}_${Math.random()}`,
      },
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to process Dice bet' });
  }
});

/**
 * POST /api/v1/games/slots/play
 */
router.post('/slots/play', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const { wagerSats, clientSeed, idempotencyKey } = req.body;

    const result = await processBet({
      uid,
      gameAdapter: slotsGame,
      input: {
        wagerSats: Number(wagerSats),
        clientSeed,
        idempotencyKey: idempotencyKey || `slots_${Date.now()}_${Math.random()}`,
      },
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to process Slots bet' });
  }
});

/**
 * POST /api/v1/games/mines/start
 */
router.post('/mines/start', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const { wagerSats, minesCount, clientSeed } = req.body;

    const result = await startMinesGame({
      uid,
      wagerSats: Number(wagerSats),
      minesCount: Number(minesCount),
      clientSeed,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to start Mines game' });
  }
});

/**
 * POST /api/v1/games/mines/reveal
 */
router.post('/mines/reveal', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;
    const { tileIndex } = req.body;

    const result = await revealMinesTile(uid, Number(tileIndex));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reveal tile' });
  }
});

/**
 * POST /api/v1/games/mines/cashout
 */
router.post('/mines/cashout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user!.uid;

    const result = await cashoutMinesGame(uid);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to cash out Mines game' });
  }
});

export default router;
