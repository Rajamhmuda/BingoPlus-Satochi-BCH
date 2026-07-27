import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-client.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useUIStore } from '../stores/ui.store.js';
import { FileCode2, ExternalLink, Anchor, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { profile } = useAuthStore();
  const { addToast } = useUIStore();
  const [treasury, setTreasury] = useState<any | null>(null);
  const [anchors, setAnchors] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [anchoring, setAnchoring] = useState(false);

  const fetchData = async () => {
    try {
      const [tData, aData] = await Promise.all([
        apiFetch('/audit/treasury'),
        apiFetch('/audit/anchors'),
      ]);
      setTreasury(tData);
      setAnchors(aData);
    } catch (err: any) {
      console.error('Failed to load audit data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyAddress = () => {
    if (treasury?.address) {
      navigator.clipboard.writeText(treasury.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('info', 'Contract address copied!');
    }
  };

  const handleAnchorNow = async () => {
    setAnchoring(true);
    try {
      const res = await apiFetch('/audit/anchor-now', { method: 'POST' });
      addToast('success', 'Broadcasted OP_RETURN batch audit anchor to Chipnet!');
      fetchData();
    } catch (err: any) {
      addToast('error', err.message || 'Anchor failed');
    } finally {
      setAnchoring(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Anchor size={36} color="#fbbf24" /> On-Chain Blockchain Audit & CashScript
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Inspect smart contract bytecode, multi-sig treasury reserves, and OP_RETURN game audit anchors on Bitcoin Cash Chipnet.
          </p>
        </div>
        <span className="badge-chipnet">CASH SCRIPT 0.10</span>
      </div>

      {/* CashScript Smart Contract Card */}
      <div className="glass-panel-gold" style={{ padding: '28px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '4px' }}>
              SMART CONTRACT TREASURY VAULT
            </div>
            <h3 style={{ fontSize: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCode2 size={24} color="#0ac18e" /> {treasury?.name || 'JackpotVault.cash'}
            </h3>
          </div>

          <a
            href={`https://chipnet.bchexplorer.info/address/${treasury?.address}`}
            target="_blank"
            rel="noreferrer"
            className="btn-bch"
            style={{ textDecoration: 'none' }}
          >
            Inspect Contract on Explorer <ExternalLink size={16} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>
          <div style={{ background: 'rgba(10,11,14,0.8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>Contract Address:</div>
            <div style={{ wordBreak: 'break-all', color: '#0ac18e' }}>{treasury?.address || 'Loading...'}</div>
          </div>

          <div style={{ background: 'rgba(10,11,14,0.8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '4px' }}>Compiled Bytecode Hex:</div>
            <div style={{ wordBreak: 'break-all', color: '#94a3b8', fontSize: '11px' }}>{treasury?.bytecodeHex || 'Loading...'}</div>
          </div>
        </div>
      </div>

      {/* OP_RETURN Audit Anchors Stream */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="#fbbf24" /> On-Chain OP_RETURN Batch Anchors
          </h4>

          {profile?.role === 'admin' && (
            <button onClick={handleAnchorNow} disabled={anchoring} className="btn-gold" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <RefreshCw size={14} className={anchoring ? 'animate-spin' : ''} /> {anchoring ? 'Anchoring...' : 'Broadcast Batch Anchor'}
            </button>
          )}
        </div>

        {anchors.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
            No on-chain OP_RETURN audit anchors broadcasted yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                  <th style={{ padding: '10px' }}>Batch Hash</th>
                  <th style={{ padding: '10px' }}>Bets Anchored</th>
                  <th style={{ padding: '10px' }}>OP_RETURN Script</th>
                  <th style={{ padding: '10px' }}>TXID & Explorer</th>
                  <th style={{ padding: '10px' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {anchors.map((item) => (
                  <tr key={item.anchorId || item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#fbbf24', fontWeight: 700 }}>
                      {item.batchHash?.slice(0, 16)}...
                    </td>
                    <td style={{ padding: '10px' }}>{item.betsCount} rounds</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#94a3b8', fontSize: '11px' }}>
                      {item.opReturnScript?.slice(0, 24)}...
                    </td>
                    <td style={{ padding: '10px' }}>
                      <a href={item.explorerUrl} target="_blank" rel="noreferrer" style={{ color: '#0ac18e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                        {item.txid?.slice(0, 10)}... <ExternalLink size={12} />
                      </a>
                    </td>
                    <td style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>
                      {new Date(item.anchoredAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
