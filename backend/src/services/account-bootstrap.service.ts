import { adminDb } from '../auth/firebase-admin.js';
import { generateTestKeypair } from '../blockchain/addresses.js';
import { encryptWif } from '../security/encryption.js';

export interface BootstrapResult {
  profile: {
    uid: string;
    displayName: string;
    email: string;
    role: 'player' | 'admin';
    createdAt: number;
  };
  wallet: {
    address: string;
    network: string;
  };
  balance: {
    availableSats: number;
    lockedSats: number;
    lifetimeDepositedSats: number;
    lifetimeWithdrawnSats: number;
    lifetimeWageredSats: number;
    lifetimeWonSats: number;
  };
}

export async function bootstrapUserAccount(
  uid: string,
  email: string,
  displayName?: string
): Promise<BootstrapResult> {
  const now = Date.now();
  const userRef = adminDb.ref(`users/${uid}`);
  const walletPublicRef = adminDb.ref(`walletsPublic/${uid}`);
  const privateWalletRef = adminDb.ref(`privateWallets/${uid}`);
  const balanceRef = adminDb.ref(`accounts/${uid}/balance`);

  // Check if account data already exists
  const [userSnap, walletSnap, balanceSnap] = await Promise.all([
    userRef.once('value'),
    walletPublicRef.once('value'),
    balanceRef.once('value'),
  ]);

  if (userSnap.exists() && walletSnap.exists() && balanceSnap.exists()) {
    const userData = userSnap.val();
    const walletData = walletSnap.val();
    const balanceData = balanceSnap.val();

    return {
      profile: {
        uid,
        displayName: userData.displayName || email.split('@')[0],
        email,
        role: userData.role || 'player',
        createdAt: userData.createdAt || now,
      },
      wallet: {
        address: walletData.address,
        network: walletData.network || 'chipnet',
      },
      balance: {
        availableSats: balanceData.availableSats || 0,
        lockedSats: balanceData.lockedSats || 0,
        lifetimeDepositedSats: balanceData.lifetimeDepositedSats || 0,
        lifetimeWithdrawnSats: balanceData.lifetimeWithdrawnSats || 0,
        lifetimeWageredSats: balanceData.lifetimeWageredSats || 0,
        lifetimeWonSats: balanceData.lifetimeWonSats || 0,
      },
    };
  }

  // Generate dynamic keypair if wallet does not exist
  let address = walletSnap.exists() ? walletSnap.val().address : null;
  if (!address) {
    const keypair = generateTestKeypair();
    address = keypair.address;
    const encryptedWif = encryptWif(keypair.wif);

    await Promise.all([
      walletPublicRef.set({
        address: keypair.address,
        network: 'chipnet',
        createdAt: now,
      }),
      privateWalletRef.set({
        ...encryptedWif,
        createdAt: now,
      }),
    ]);
  }

  const startingSats = parseInt(process.env.DEMO_STARTING_SATS || '50000', 10);
  const finalDisplayName = displayName || email.split('@')[0] || `SatoshiPlayer_${uid.slice(0, 5)}`;

  const profileData = {
    displayName: finalDisplayName,
    email,
    role: 'player',
    createdAt: now,
    updatedAt: now,
    responsibleGaming: {
      selfExcludedUntil: null,
      maxBetSats: parseInt(process.env.MAX_BET_SATS || '5000', 10),
      dailyLossLimitSats: 100000,
      sessionReminderMinutes: 60,
    },
  };

  const balanceData = {
    availableSats: startingSats,
    lockedSats: 0,
    lifetimeDepositedSats: startingSats,
    lifetimeWithdrawnSats: 0,
    lifetimeWageredSats: 0,
    lifetimeWonSats: 0,
    updatedAt: now,
    version: 1,
  };

  if (!userSnap.exists()) {
    await userRef.set(profileData);
  }

  if (!balanceSnap.exists()) {
    await balanceRef.set(balanceData);
  }

  return {
    profile: {
      uid,
      displayName: finalDisplayName,
      email,
      role: 'player',
      createdAt: now,
    },
    wallet: {
      address,
      network: 'chipnet',
    },
    balance: balanceData,
  };
}
