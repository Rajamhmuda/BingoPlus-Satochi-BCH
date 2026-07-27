import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}

function getMasterKey(): Buffer {
  const hexKey = process.env.WALLET_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  return Buffer.from(hexKey, 'hex');
}

function getKeyVersion(): number {
  return parseInt(process.env.WALLET_ENCRYPTION_KEY_VERSION || '1', 10);
}

/**
 * Encrypts a private key (WIF) using AES-256-GCM
 */
export function encryptWif(plaintextWif: string): EncryptedData {
  const iv = crypto.randomBytes(12);
  const masterKey = getMasterKey();
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  let encrypted = cipher.update(plaintextWif, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag,
    keyVersion: getKeyVersion(),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted private key (WIF)
 */
export function decryptWif(encrypted: EncryptedData): string {
  const masterKey = getMasterKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    masterKey,
    Buffer.from(encrypted.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

  let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
