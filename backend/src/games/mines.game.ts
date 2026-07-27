import { adminDb } from '../auth/firebase-admin.js';
import { deriveFairOutcome, getOrCreateActiveEpoch } from '../services/fairness.service.js';
import crypto from 'crypto';

export interface MinesStartParams {
  uid: string;
  wagerSats: number;
  minesCount: number; // 1 to 24
  clientSeed?: string;
}

export interface MinesSession {
  sessionId: string;
  wagerSats: number;
  minesCount: number;
  minePositions: number[]; // 0..24
  revealedTiles?: number[];
  currentMultiplier: number;
  status: 'active' | 'cashed_out' | 'busted';
  createdAt: number;
}

function calculateMinesMultiplier(minesCount: number, gemsRevealed: number): number {
  if (gemsRevealed === 0) return 1.0;
  
  let probability = 1.0;
  const totalTiles = 25;
  const safeTiles = totalTiles - minesCount;

  for (let i = 0; i < gemsRevealed; i++) {
    probability *= (safeTiles - i) / (totalTiles - i);
  }

  const rtp = 0.97; // 97% RTP (3% house edge)
  return Number((rtp / probability).toFixed(4));
}

export async function startMinesGame(params: MinesStartParams): Promise<{
  sessionId: string;
  minesCount: number;
  revealedTiles: number[];
  currentMultiplier: number;
  status: string;
}> {
  const { uid, wagerSats, minesCount, clientSeed } = params;

  if (isNaN(minesCount) || minesCount < 1 || minesCount > 24) {
    throw new Error('Mines count must be between 1 and 24.');
  }

  const minBet = 100;
  const maxBet = 5000;
  if (isNaN(wagerSats) || wagerSats < minBet || wagerSats > maxBet) {
    throw new Error(`Wager must be between ${minBet} and ${maxBet} satoshis.`);
  }

  // Check if active session exists
  const sessionRef = adminDb.ref(`accounts/${uid}/minesSession`);
  const activeSnap = await sessionRef.once('value');
  if (activeSnap.exists() && activeSnap.val().status === 'active') {
    const oldSession = activeSnap.val();
    // Auto-forfeit stale sessions older than 5 minutes or allow new session
    const isStale = (Date.now() - (oldSession.createdAt || 0)) > 300000;
    if (!isStale && (oldSession.revealedTiles || []).length > 0) {
      throw new Error('You already have an active Mines game. Cash out or finish it first.');
    }
  }

  // Reserve wager balance
  const balanceRef = adminDb.ref(`accounts/${uid}/balance`);
  const reserveTx = await balanceRef.transaction((currentBalance) => {
    if (!currentBalance) return currentBalance;
    if ((currentBalance.availableSats || 0) < wagerSats) return;
    currentBalance.availableSats -= wagerSats;
    currentBalance.lockedSats = (currentBalance.lockedSats || 0) + wagerSats;
    currentBalance.updatedAt = Date.now();
    return currentBalance;
  });

  if (!reserveTx.committed) {
    throw new Error('Insufficient balance for Mines game.');
  }

  // Derive mine positions provably fair
  const activeEpoch = await getOrCreateActiveEpoch();
  const nonceRef = adminDb.ref(`accounts/${uid}/fairnessNonces/mines`);
  let nonce = 1;
  await nonceRef.transaction((current) => {
    nonce = (current || 0) + 1;
    return nonce;
  });

  const outcome = deriveFairOutcome(activeEpoch.serverSeed, clientSeed || `client_${uid.slice(0,6)}`, nonce, 'mines');

  // Shuffle 0..24 indices using HMAC hex
  const indices = Array.from({ length: 25 }, (_, i) => i);
  const hashHex = outcome.hmacHex;

  for (let i = indices.length - 1; i > 0; i--) {
    const hexSlice = hashHex.slice((i * 2) % 56, ((i * 2) % 56) + 4);
    const rand = parseInt(hexSlice, 16) % (i + 1);
    [indices[i], indices[rand]] = [indices[rand], indices[i]];
  }

  const minePositions = indices.slice(0, minesCount);
  const sessionId = `mines_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = Date.now();

  const sessionData: MinesSession = {
    sessionId,
    wagerSats,
    minesCount,
    minePositions,
    revealedTiles: [],
    currentMultiplier: 1.0,
    status: 'active',
    createdAt: now,
  };

  await sessionRef.set(sessionData);

  return {
    sessionId,
    minesCount,
    revealedTiles: [],
    currentMultiplier: 1.0,
    status: 'active',
  };
}

export async function revealMinesTile(uid: string, tileIndex: number): Promise<{
  hitMine: boolean;
  tileIndex: number;
  revealedTiles: number[];
  currentMultiplier: number;
  status: string;
  minePositions?: number[];
}> {
  if (isNaN(tileIndex) || tileIndex < 0 || tileIndex > 24) {
    throw new Error('Tile index must be a number between 0 and 24.');
  }

  const sessionRef = adminDb.ref(`accounts/${uid}/minesSession`);
  const snap = await sessionRef.once('value');

  if (!snap.exists() || snap.val().status !== 'active') {
    throw new Error('No active Mines session found. Start a new game first.');
  }

  const session: MinesSession = snap.val();
  const revealedTiles = Array.isArray(session.revealedTiles) ? session.revealedTiles : [];

  if (revealedTiles.includes(tileIndex)) {
    throw new Error('Tile already revealed.');
  }

  const minePositions = Array.isArray(session.minePositions) ? session.minePositions : [];
  const hitMine = minePositions.includes(tileIndex);
  const now = Date.now();

  if (hitMine) {
    // Player busted! Locked wager consumed
    const balanceRef = adminDb.ref(`accounts/${uid}/balance`);
    await balanceRef.transaction((currentBalance) => {
      if (!currentBalance) return currentBalance;
      currentBalance.lockedSats = Math.max(0, (currentBalance.lockedSats || 0) - session.wagerSats);
      currentBalance.lifetimeWageredSats = (currentBalance.lifetimeWageredSats || 0) + session.wagerSats;
      currentBalance.updatedAt = now;
      return currentBalance;
    });

    session.status = 'busted';
    revealedTiles.push(tileIndex);
    session.revealedTiles = revealedTiles;
    await sessionRef.set(session);

    return {
      hitMine: true,
      tileIndex,
      revealedTiles,
      currentMultiplier: 0,
      status: 'busted',
      minePositions,
    };
  } else {
    // Gem revealed!
    revealedTiles.push(tileIndex);
    session.revealedTiles = revealedTiles;
    const newMultiplier = calculateMinesMultiplier(session.minesCount, revealedTiles.length);
    session.currentMultiplier = newMultiplier;

    await sessionRef.set(session);

    return {
      hitMine: false,
      tileIndex,
      revealedTiles,
      currentMultiplier: newMultiplier,
      status: 'active',
    };
  }
}

export async function cashoutMinesGame(uid: string): Promise<{
  sessionId: string;
  payoutSats: number;
  multiplier: number;
  balanceAfterSats: number;
  minePositions: number[];
}> {
  const sessionRef = adminDb.ref(`accounts/${uid}/minesSession`);
  const snap = await sessionRef.once('value');

  if (!snap.exists() || snap.val().status !== 'active') {
    throw new Error('No active Mines session to cash out.');
  }

  const session: MinesSession = snap.val();
  const revealedTiles = Array.isArray(session.revealedTiles) ? session.revealedTiles : [];

  if (revealedTiles.length === 0) {
    throw new Error('Reveal at least one tile before cashing out.');
  }

  const payoutSats = Math.floor(session.wagerSats * session.currentMultiplier);
  const now = Date.now();
  const balanceRef = adminDb.ref(`accounts/${uid}/balance`);
  let finalAvailable = 0;

  await balanceRef.transaction((currentBalance) => {
    if (!currentBalance) return currentBalance;
    currentBalance.lockedSats = Math.max(0, (currentBalance.lockedSats || 0) - session.wagerSats);
    currentBalance.availableSats += payoutSats;
    currentBalance.lifetimeWageredSats = (currentBalance.lifetimeWageredSats || 0) + session.wagerSats;
    currentBalance.lifetimeWonSats = (currentBalance.lifetimeWonSats || 0) + payoutSats;
    currentBalance.updatedAt = now;
    finalAvailable = currentBalance.availableSats;
    return currentBalance;
  });

  session.status = 'cashed_out';
  await sessionRef.set(session);

  const minePositions = Array.isArray(session.minePositions) ? session.minePositions : [];

  // Write bet record
  await Promise.all([
    adminDb.ref(`public/recentBets/${session.sessionId}`).set({
      betId: session.sessionId,
      maskedPlayerName: `Player***`,
      gameId: 'mines',
      wagerSats: session.wagerSats,
      payoutSats,
      multiplier: session.currentMultiplier,
      createdAt: now,
    }),
    adminDb.ref(`userLedger/${uid}/${now}_${session.sessionId}`).set({
      type: 'bet_win',
      amountSats: payoutSats - session.wagerSats,
      balanceAfterSats: finalAvailable,
      referenceType: 'bet',
      referenceId: session.sessionId,
      createdAt: now,
    }),
  ]);

  return {
    sessionId: session.sessionId,
    payoutSats,
    multiplier: session.currentMultiplier,
    balanceAfterSats: finalAvailable,
    minePositions,
  };
}
