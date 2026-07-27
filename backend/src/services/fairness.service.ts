import crypto from 'crypto';
import { adminDb } from '../auth/firebase-admin.js';

export interface FairnessEpoch {
  epochId: string;
  serverSeedHash: string;
  startedAt: number;
  endedAt?: number;
  revealedServerSeed?: string;
  status: 'active' | 'rotated';
}

export interface DerivedOutcome {
  hmacHex: string;
  floatValue: number; // 0.00 to 99.99
  intValue: number;   // 0 to 9999
}

/**
 * Derives a deterministic provably fair outcome value (0.00 to 99.99)
 */
export function deriveFairOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  gameId: string
): DerivedOutcome {
  const message = `${clientSeed}:${nonce}:${gameId}`;
  const hmac = crypto.createHmac('sha256', serverSeed).update(message).digest('hex');

  // Take first 8 hex characters (4 bytes)
  const bytesHex = hmac.substring(0, 8);
  const intVal = parseInt(bytesHex, 16);

  // Scale to 0-9999 then / 100 -> 0.00 - 99.99
  const scaledInt = intVal % 10000;
  const floatVal = Number((scaledInt / 100).toFixed(2));

  return {
    hmacHex: hmac,
    floatValue: floatVal,
    intValue: scaledInt,
  };
}

/**
 * Returns current active fairness epoch or creates one if none exists
 */
export async function getOrCreateActiveEpoch(): Promise<{ epochId: string; serverSeedHash: string; serverSeed: string }> {
  const activeEpochRef = adminDb.ref('public/system/activeFairnessEpochId');
  const activeSnap = await activeEpochRef.once('value');

  if (activeSnap.exists()) {
    const epochId = activeSnap.val();
    const [epochSnap, secretSnap] = await Promise.all([
      adminDb.ref(`public/fairnessEpochs/${epochId}`).once('value'),
      adminDb.ref(`serverFairnessSeeds/${epochId}`).once('value'),
    ]);

    if (epochSnap.exists() && secretSnap.exists()) {
      return {
        epochId,
        serverSeedHash: epochSnap.val().serverSeedHash,
        serverSeed: secretSnap.val().serverSeed,
      };
    }
  }

  // Create new epoch
  return await createNewFairnessEpoch();
}

/**
 * Rotates the current active fairness epoch and discloses the previous server seed
 */
export async function createNewFairnessEpoch(): Promise<{ epochId: string; serverSeedHash: string; serverSeed: string }> {
  const activeEpochRef = adminDb.ref('public/system/activeFairnessEpochId');
  const oldEpochIdSnap = await activeEpochRef.once('value');

  const now = Date.now();

  // If previous active epoch exists, rotate and reveal its server seed
  if (oldEpochIdSnap.exists()) {
    const oldEpochId = oldEpochIdSnap.val();
    const oldSecretSnap = await adminDb.ref(`serverFairnessSeeds/${oldEpochId}`).once('value');
    if (oldSecretSnap.exists()) {
      const oldSeed = oldSecretSnap.val().serverSeed;
      await adminDb.ref(`public/fairnessEpochs/${oldEpochId}`).update({
        revealedServerSeed: oldSeed,
        endedAt: now,
        status: 'rotated',
      });
    }
  }

  // Generate new seed & hash
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  const newEpochId = `epoch_${now}_${crypto.randomBytes(4).toString('hex')}`;

  await Promise.all([
    adminDb.ref(`public/fairnessEpochs/${newEpochId}`).set({
      epochId: newEpochId,
      serverSeedHash,
      startedAt: now,
      status: 'active',
    }),
    adminDb.ref(`serverFairnessSeeds/${newEpochId}`).set({
      serverSeed,
      serverSeedHash,
      createdAt: now,
    }),
    activeEpochRef.set(newEpochId),
  ]);

  return {
    epochId: newEpochId,
    serverSeedHash,
    serverSeed,
  };
}
