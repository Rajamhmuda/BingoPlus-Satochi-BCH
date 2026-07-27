import React, { useState } from 'react';
import { useUIStore } from '../../stores/ui.store.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { apiFetch } from '../../lib/api-client.js';
import { X, ArrowUpRight, ExternalLink } from 'lucide-react';

export const WithdrawModal: React.FC = () => {
  const { withdrawModalOpen, closeWithdrawModal, addToast } = useUIStore();
  const { balance, updateBalance } = useAuthStore();
  const [destination, setDestination] = useState('');
  const [amountSats, setAmountSats] = useState('2000');
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<{ txid: string; explorerUrl: string } | null>(null);

  if (!withdrawModalOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTxResult(null);

    try {
      const res = await apiFetch('/wallet/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          destination,
          amountSats: Number(amountSats),
        }),
      });

      setTxResult({ txid: res.txid, explorerUrl: res.explorerUrl });
      addToast('success', 'Withdrawal transaction broadcast on Chipnet!');
      
      // Update balance
      const walletInfo = await apiFetch('/wallet');
      if (walletInfo.balance) {
        updateBalance(walletInfo.balance);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px', position: 'relative' }}>
        
        <button onClick={closeWithdrawModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '22px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💸 Withdraw Test Satoshis
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
          Send Chipnet BCH from your available balance to an external testnet address.
        </p>

        {txResult ? (
          <div style={{ background: 'rgba(10, 193, 142, 0.1)', border: '1px solid rgba(10, 193, 142, 0.4)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <h4 style={{ color: '#0ac18e', marginBottom: '8px' }}>Transaction Broadcasted!</h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
              TXID: {txResult.txid}
            </p>
            <a href={txResult.explorerUrl} target="_blank" rel="noreferrer" className="btn-bch" style={{ textDecoration: 'none', width: '100%' }}>
              View on Chipnet Explorer <ExternalLink size={16} />
            </a>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Chipnet Destination Address
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="bchtest:..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                  Amount (Satoshis)
                </label>
                <span style={{ fontSize: '12px', color: '#fbbf24' }}>
                  Available: {(balance?.availableSats ?? 0).toLocaleString()} SATS
                </span>
              </div>
              <input
                type="number"
                className="input-field"
                placeholder="1000"
                min="1000"
                value={amountSats}
                onChange={(e) => setAmountSats(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-gold" style={{ marginTop: '8px', width: '100%' }}>
              {loading ? 'Broadcasting...' : 'Execute Chipnet Withdrawal'} <ArrowUpRight size={16} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
