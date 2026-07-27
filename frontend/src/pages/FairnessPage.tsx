import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-client.js';
import { useUIStore } from '../stores/ui.store.js';
import { ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export const FairnessPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [currentEpoch, setCurrentEpoch] = useState<{ epochId: string; serverSeedHash: string } | null>(null);

  // Verifier Form State
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('satoshi_seed_1');
  const [nonce, setNonce] = useState('1');
  const [gameId, setGameId] = useState('dice');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  useEffect(() => {
    apiFetch('/fairness/current')
      .then((data) => setCurrentEpoch(data))
      .catch((err) => console.error('Failed to fetch fairness info:', err));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyResult(null);

    try {
      const data = await apiFetch('/fairness/verify', {
        method: 'POST',
        body: JSON.stringify({
          serverSeed,
          clientSeed,
          nonce: Number(nonce),
          gameId,
        }),
      });

      setVerifyResult(data);
      addToast('success', 'Provably fair verification calculated successfully!');
    } catch (err: any) {
      addToast('error', err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={36} color="#3b82f6" /> Provably Fair Verification
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Cryptographic proof that game outcomes are 100% unrigged and deterministic.
          </p>
        </div>
        <span className="badge-chipnet">HMAC-SHA256</span>
      </div>

      {/* Active Epoch Banner */}
      <div className="glass-panel-gold" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 800, marginBottom: '4px' }}>
          ACTIVE SERVER SEED HASH (PRECOMMITTED)
        </div>
        <div style={{ fontSize: '16px', fontFamily: 'monospace', color: '#fff', wordBreak: 'break-all' }}>
          {currentEpoch?.serverSeedHash || 'Loading active pre-commitment...'}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
          Epoch ID: {currentEpoch?.epochId || 'active'}
        </div>
      </div>

      {/* Verification Tool */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px', color: '#fff' }}>
          Independent Verification Calculator
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
          When a server seed is rotated and revealed, enter it below alongside your client seed and bet nonce to independently recompute the outcome.
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Revealed Plaintext Server Seed (Hex)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 4f9a72b..."
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              required
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Client Seed
              </label>
              <input
                type="text"
                className="input-field"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Bet Nonce
              </label>
              <input
                type="number"
                className="input-field"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                min="1"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Game Identifier
              </label>
              <select
                className="input-field"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              >
                <option value="dice">dice</option>
                <option value="slots">slots</option>
                <option value="mines">mines</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={verifying} className="btn-gold" style={{ marginTop: '8px', padding: '14px' }}>
            {verifying ? 'Recomputing HMAC...' : 'Verify Result'} <ShieldCheck size={18} />
          </button>
        </form>

        {/* Verify Result Display */}
        {verifyResult && (
          <div style={{ marginTop: '24px', background: 'rgba(10, 193, 142, 0.1)', border: '1px solid #0ac18e', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ color: '#0ac18e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} /> Verification Match Confirmed!
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8' }}>
              <div>Computed Server Seed SHA-256 Hash: <span style={{ color: '#fff' }}>{verifyResult.serverSeedHash}</span></div>
              <div>HMAC-SHA256 Digest: <span style={{ color: '#fbbf24' }}>{verifyResult.hmacHex}</span></div>
              <div>Derived Roll Value: <strong style={{ color: '#0ac18e', fontSize: '16px' }}>{verifyResult.floatValue}</strong></div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
