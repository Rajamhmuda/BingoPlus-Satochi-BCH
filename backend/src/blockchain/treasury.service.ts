import crypto from 'crypto';
import bs58check from 'bs58check';
import bchaddr from 'bchaddrjs';

export interface ContractInfo {
  name: string;
  network: string;
  address: string;
  bytecodeHex: string;
  houseOwnerPubKeyHex: string;
  adminTwoPubKeyHex: string;
  createdAt: number;
}

/**
 * Derives a Chipnet address and pubkey from a seed string
 */
function derivePubKey(seedStr: string): { pubKeyHex: string; address: string } {
  const privateKey = crypto.createHash('sha256').update(seedStr).digest();
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.setPrivateKey(privateKey);
  const pubKey = ecdh.getPublicKey(null, 'compressed');
  
  const sha256 = crypto.createHash('sha256').update(pubKey).digest();
  const pubKeyHash = crypto.createHash('ripemd160').update(sha256).digest();

  // 0x6F = testnet P2PKH version byte → bchaddrjs.toCashAddress gives bchtest: prefix
  const legacyTestnetAddr = bs58check.encode(
    Buffer.concat([Buffer.from([0x6f]), pubKeyHash])
  );
  const address = (bchaddr as any).toCashAddress(legacyTestnetAddr);

  return {
    pubKeyHex: pubKey.toString('hex'),
    address,
  };
}

/**
 * Returns CashScript Jackpot Vault smart contract information and address
 */
export function getJackpotVaultInfo(): ContractInfo {
  const houseOwner = derivePubKey('house_owner_key_seed_bingoplus_satoshi');
  const adminTwo = derivePubKey('admin_two_key_seed_bingoplus_satoshi');

  // Simulated P2SH smart contract CashAddr for Chipnet
  const contractHash = crypto.createHash('sha256')
    .update(`JackpotVault:${houseOwner.pubKeyHex}:${adminTwo.pubKeyHex}`)
    .digest('hex');

  const rawBytes = Buffer.from(contractHash.slice(0, 40), 'hex');
  // 0xC4 = testnet P2SH version byte
  const p2shLegacy = bs58check.encode(Buffer.concat([Buffer.from([0xc4]), rawBytes]));
  const contractAddress = (bchaddr as any).toCashAddress(p2shLegacy);

  const bytecodeHex = '02' + houseOwner.pubKeyHex + '02' + adminTwo.pubKeyHex + 'ac52795279ac';

  return {
    name: 'JackpotVault.cash',
    network: 'chipnet',
    address: contractAddress,
    bytecodeHex,
    houseOwnerPubKeyHex: houseOwner.pubKeyHex,
    adminTwoPubKeyHex: adminTwo.pubKeyHex,
    createdAt: 1722124800000,
  };
}
