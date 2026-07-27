import crypto from 'crypto';
import wif from 'wif';
import bs58check from 'bs58check';
import bchaddr from 'bchaddrjs';

export interface Keypair {
  wif: string;
  address: string;
}

/**
 * Computes RIPEMD160(SHA256(buffer))
 */
function hash160(buffer: Buffer): Buffer {
  const sha256 = crypto.createHash('sha256').update(buffer).digest();
  return crypto.createHash('ripemd160').update(sha256).digest();
}

/**
 * Generates a fresh Bitcoin Cash Chipnet keypair (WIF + bchtest: address)
 */
export function generateTestKeypair(): Keypair {
  // Generate 32 random bytes for private key
  const privateKey = crypto.randomBytes(32);

  // Encode to WIF (0xEF is Bitcoin Testnet/Chipnet WIF version)
  const wifString = wif.encode(0xef, privateKey, true);

  // Get compressed public key using Node.js ECDH secp256k1
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.setPrivateKey(privateKey);
  const pubKey = ecdh.getPublicKey(null, 'compressed');

  // Calculate Hash160 of public key
  const pubKeyHash = hash160(pubKey);

  // Encode legacy testnet P2PKH address (version byte 0x6F = testnet)
  const legacyTestnetAddr = bs58check.encode(
    Buffer.concat([Buffer.from([0x6f]), pubKeyHash])
  );

  // Convert legacy testnet address to CashAddr — bchaddrjs detects
  // the 0x6F version byte and produces a bchtest: prefix automatically
  const chipnetAddr = (bchaddr as any).toCashAddress(legacyTestnetAddr);

  return {
    wif: wifString,
    address: chipnetAddr,
  };
}

/**
 * Validates whether a string is a valid Chipnet CashAddr (starts with bchtest:)
 */
export function isValidChipnetAddress(address: string): boolean {
  try {
    if (!address || typeof address !== 'string') return false;
    const formatted = address.startsWith('bchtest:') ? address : `bchtest:${address}`;
    return (bchaddr as any).isTestnetAddress(formatted);
  } catch {
    return false;
  }
}
