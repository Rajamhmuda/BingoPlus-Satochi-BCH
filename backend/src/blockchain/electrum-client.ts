import tls from 'tls';
import net from 'net';
import crypto from 'crypto';
import bchaddr from 'bchaddrjs';
import bs58check from 'bs58check';

export interface FulcrumUtxo {
  height: number;
  tx_hash: string;
  tx_pos: number;
  value: number;
}

const CHIPNET_FULCRUM_NODES = [
  { host: 'chipnet.bch.ninja', port: 50002, useTls: true },
  { host: 'chipnet.imaginary.cash', port: 50002, useTls: true },
];

/**
 * Computes Electrum scripthash for a CashAddr address
 */
export function addressToScriptHash(address: string): string {
  const formatted = address.startsWith('bchtest:') ? address : `bchtest:${address}`;
  const legacy = (bchaddr as any).toLegacyAddress(formatted);
  const decoded = bs58check.decode(legacy);
  const pkh = decoded.slice(1);
  
  // P2PKH Script: OP_DUP (0x76) OP_HASH160 (0xa9) <20-byte pkh> (0x14) OP_EQUALVERIFY (0x88) OP_CHECKSIG (0xac)
  const script = Buffer.concat([Buffer.from([0x76, 0xa9, 0x14]), pkh, Buffer.from([0x88, 0xac])]);
  const sha256 = crypto.createHash('sha256').update(script).digest();
  return Buffer.from(sha256).reverse().toString('hex');
}

/**
 * Fetches real on-chain UTXOs for a Chipnet CashAddr address via Fulcrum/Electrum JSON-RPC
 */
export async function fetchChipnetUtxos(address: string): Promise<FulcrumUtxo[]> {
  const scriptHash = addressToScriptHash(address);

  for (const node of CHIPNET_FULCRUM_NODES) {
    try {
      const utxos = await queryFulcrumNode(node.host, node.port, node.useTls, scriptHash);
      if (utxos && Array.isArray(utxos)) {
        return utxos;
      }
    } catch (err: any) {
      console.warn(`Fulcrum node ${node.host}:${node.port} failed:`, err.message);
    }
  }

  return [];
}

function queryFulcrumNode(
  host: string,
  port: number,
  useTls: boolean,
  scriptHash: string
): Promise<FulcrumUtxo[]> {
  return new Promise((resolve, reject) => {
    let socket: net.Socket;

    const timeout = setTimeout(() => {
      if (socket) socket.destroy();
      reject(new Error(`Fulcrum request timeout to ${host}:${port}`));
    }, 6000);

    const onConnect = () => {
      const req = JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'blockchain.scripthash.listunspent',
        params: [scriptHash],
      }) + '\n';
      socket.write(req);
    };

    if (useTls) {
      socket = tls.connect(port, host, { rejectUnauthorized: false }, onConnect);
    } else {
      socket = net.connect(port, host, onConnect);
    }

    let buffer = '';

    socket.on('data', (data) => {
      buffer += data.toString('utf8');
      if (buffer.includes('\n')) {
        clearTimeout(timeout);
        try {
          const lines = buffer.split('\n').filter((l) => l.trim().length > 0);
          for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed.id === 1) {
              socket.end();
              if (parsed.error) {
                return reject(new Error(parsed.error.message || 'Fulcrum RPC Error'));
              }
              return resolve(parsed.result || []);
            }
          }
        } catch (err) {
          socket.end();
          reject(err);
        }
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
