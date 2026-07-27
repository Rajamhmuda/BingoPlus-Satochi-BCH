import { adminDb } from '../auth/firebase-admin.js';
import { GameAdapter } from '../games/game-adapter.js';
import { getOrCreateActiveEpoch, deriveFairOutcome } from './fairness.service.js';
import crypto from 'crypto';

export interface PlayBetParams<TInput> {
  uid: string;
  gameAdapter: GameAdapter<TInput, any>;
  input: TInput;
}

export async function processBet<TInput, TResult>(
  params: PlayBetParams<TInput>
): Promise<{
  betId: string;
  result: TResult;
  payoutSats: number;
  balanceAfterSats: number;
  fairness: {
    epochId: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    hmacHex: string;
    roll: number;
  };
}> {
  const { uid, gameAdapter, input } = params;
  const gameId = gameAdapter.gameId;
  const anyInput = input as any;
  const wagerSats = Number(anyInput.wagerSats);
  
  // Sanitize idempotency key so Firebase RTDB paths never contain invalid characters (., #, $, [, ])
  const rawKey = anyInput.idempotencyKey || `key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const idempotencyKey = String(rawKey).replace(/[.#$\[\]]/g, '_');

  const clientSeed = anyInput.clientSeed || `client_${uid.slice(0, 6)}`;

  // 1. Check Global Pause & Game Enabled Status
  const [systemSnap, gameSnap, userSnap] = await Promise.all([
    adminDb.ref('public/system/bettingEnabled').once('value'),
    adminDb.ref(`public/games/${gameId}`).once('value'),
    adminDb.ref(`users/${uid}`).once('value'),
  ]);

  if (systemSnap.exists() && systemSnap.val() === false) {
    throw new Error('Betting is currently paused by platform administrator.');
  }

  if (gameSnap.exists() && gameSnap.val().enabled === false) {
    throw new Error(`Game ${gameId} is currently disabled.`);
  }

  // 2. Responsible Gaming Check
  if (userSnap.exists()) {
    const rg = userSnap.val().responsibleGaming;
    if (rg?.selfExcludedUntil && rg.selfExcludedUntil > Date.now()) {
      throw new Error('Account is currently self-excluded.');
    }
    if (rg?.maxBetSats && wagerSats > rg.maxBetSats) {
      throw new Error(`Wager exceeds your personal max bet limit of ${rg.maxBetSats} satoshis.`);
    }
  }

  // 3. Idempotency Check
  const idempotencyRef = adminDb.ref(`accounts/${uid}/idempotency/${idempotencyKey}`);
  const idempotencySnap = await idempotencyRef.once('value');
  if (idempotencySnap.exists()) {
    return idempotencySnap.val().response;
  }

  // 4. Validate Input
  const gameConfig = gameSnap.exists() ? gameSnap.val() : {};
  gameAdapter.validateInput(input, gameConfig);

  // 5. Reserve Balance via RTDB Transaction
  const balanceRef = adminDb.ref(`accounts/${uid}/balance`);

  const reserveTx = await balanceRef.transaction((currentBalance) => {
    if (!currentBalance) return currentBalance;
    if ((currentBalance.availableSats || 0) < wagerSats) {
      return; // Abort transaction if insufficient funds
    }
    currentBalance.availableSats -= wagerSats;
    currentBalance.lockedSats = (currentBalance.lockedSats || 0) + wagerSats;
    currentBalance.updatedAt = Date.now();
    currentBalance.version = (currentBalance.version || 1) + 1;
    return currentBalance;
  });

  if (!reserveTx.committed) {
    throw new Error('Insufficient balance for this bet.');
  }

  // 6. Increment Fairness Nonce
  const nonceRef = adminDb.ref(`accounts/${uid}/fairnessNonces/${gameId}`);
  let nonce = 1;
  await nonceRef.transaction((currentNonce) => {
    nonce = (currentNonce || 0) + 1;
    return nonce;
  });

  // 7. Get Active Fairness Epoch & Derivation
  const activeEpoch = await getOrCreateActiveEpoch();
  const outcome = deriveFairOutcome(activeEpoch.serverSeed, clientSeed, nonce, gameId);

  // 8. Resolve Game Result
  const result = gameAdapter.resolve(input, outcome, gameConfig);
  const payoutSats = gameAdapter.calculatePayout(input, result, gameConfig);

  // 9. Settle Balance via RTDB Transaction
  let finalAvailable = 0;
  const settleTx = await balanceRef.transaction((currentBalance) => {
    if (!currentBalance) return currentBalance;
    currentBalance.lockedSats = Math.max(0, (currentBalance.lockedSats || 0) - wagerSats);
    currentBalance.availableSats += payoutSats;
    currentBalance.lifetimeWageredSats = (currentBalance.lifetimeWageredSats || 0) + wagerSats;
    currentBalance.lifetimeWonSats = (currentBalance.lifetimeWonSats || 0) + payoutSats;
    currentBalance.updatedAt = Date.now();
    currentBalance.version = (currentBalance.version || 1) + 1;
    finalAvailable = currentBalance.availableSats;
    return currentBalance;
  });

  const betId = `bet_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = Date.now();

  const responsePayload = {
    betId,
    result,
    payoutSats,
    balanceAfterSats: finalAvailable || (settleTx.snapshot.val()?.availableSats ?? 0),
    fairness: {
      epochId: activeEpoch.epochId,
      serverSeedHash: activeEpoch.serverSeedHash,
      clientSeed,
      nonce,
      hmacHex: outcome.hmacHex,
      roll: outcome.floatValue,
    },
  };

  // 10. Write Bet Records, Ledger, and Idempotency
  const userDisplayName = userSnap.exists() ? userSnap.val().displayName : 'Player';
  const maskedName = `${userDisplayName.slice(0, 3)}***`;

  await Promise.all([
    adminDb.ref(`public/recentBets/${betId}`).set({
      betId,
      maskedPlayerName: maskedName,
      gameId,
      wagerSats,
      payoutSats,
      multiplier: (result as any).multiplier || 0,
      createdAt: now,
    }),
    adminDb.ref(`userBets/${uid}/${betId}`).set({
      betId,
      gameId,
      status: 'settled',
      wagerSats,
      payoutSats,
      resultSummary: gameAdapter.toPublicResult(result),
      fairnessEpochId: activeEpoch.epochId,
      clientSeed,
      nonce,
      createdAt: now,
    }),
    adminDb.ref(`userLedger/${uid}/${now}_${betId}`).set({
      type: payoutSats > 0 ? 'bet_win' : 'bet_loss',
      amountSats: payoutSats - wagerSats,
      balanceAfterSats: responsePayload.balanceAfterSats,
      referenceType: 'bet',
      referenceId: betId,
      createdAt: now,
    }),
    idempotencyRef.set({
      operation: `${gameId}_play`,
      response: responsePayload,
      createdAt: now,
    }),
  ]);

  return responsePayload;
}
