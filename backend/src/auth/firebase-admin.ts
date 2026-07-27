import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

function generateDevRsaPrivateKey(): string {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return privateKey;
}

function initFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'bingoplusbch';
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './secrets/firebase-service-account.json';

  let credential: admin.credential.Credential;
  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

  // 1. Production Mode: JSON Service Account File exists
  if (fs.existsSync(resolvedPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert(serviceAccount);
      console.log(`🔑 Firebase Admin: Authenticated via service account file (${serviceAccountPath})`);
    } catch (err: any) {
      console.warn(`⚠️ Warning reading ${serviceAccountPath}: ${err.message}. Falling back to dev mode.`);
      credential = createDevFallbackCredential(projectId);
    }
  }
  // 2. Production Mode: Environment Variables (FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY)
  else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    console.log(`🔑 Firebase Admin: Authenticated via environment variables`);
  }
  // 3. Local Emulator / Dev Mode Fallback
  else {
    console.log(`⚡ Dev/Emulator Mode: Service account file not found at ${serviceAccountPath}`);
    console.log(`💡 To use production Firebase, place your service account JSON file at: ${serviceAccountPath}`);
    
    if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
      process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:9000';
    }
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    }

    credential = createDevFallbackCredential(projectId);
  }

  return admin.initializeApp({
    credential,
    databaseURL,
    projectId,
  });
}

function createDevFallbackCredential(projectId: string): admin.credential.Credential {
  const devPrivateKey = generateDevRsaPrivateKey();
  return admin.credential.cert({
    projectId,
    clientEmail: `dev-admin@${projectId}.iam.gserviceaccount.com`,
    privateKey: devPrivateKey,
  });
}

export const firebaseApp = initFirebaseAdmin();
export const adminAuth = firebaseApp.auth();
export const adminDb = firebaseApp.database();
