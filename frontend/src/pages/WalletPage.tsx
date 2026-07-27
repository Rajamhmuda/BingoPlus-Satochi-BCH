import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth.store.js';
import { useUIStore } from '../stores/ui.store.js';
import { apiFetch } from '../lib/api-client.js';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, PlusCircle, ArrowUpRight, Copy, Check, ExternalLink, RefreshCw, History } from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { walletAddress, balance, updateBalance } = useAuthStore();
  const { openDepositModal, openWithdrawModal, addToast } = useUIStore();
  const [ledger, setLedger] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchWallet = async () => {
    try {
      const data = await apiFetch('/wallet');
      if (data?.address) {
        useAuthStore.setState({ walletAddress: data.address });
      }
      if (data?.balance) {
        updateBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch wallet info:', err);
    }
  };

  const fetchLedger = async () => {
    try {
      const data = await apiFetch('/wallet/ledger');
      setLedger(data);
    } catch (err: any) {
      console.error('Failed to fetch ledger:', err);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchLedger();

    // Auto-sync deposits in background every 8 seconds while on Wallet Page
    const interval = setInterval(() => {
      apiFetch('/wallet/sync-deposits', { method: 'POST' })
        .then((res) => {
          if (res && res.totalCreditedSats > 0) {
            addToast('success', `⚡ Auto-Credited +${res.totalCreditedSats} SATS from Chipnet deposit!`);
            fetchWallet();
            fetchLedger();
          }
        })
        .catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, [addToast, updateBalance]);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('info', 'Address copied to clipboard!');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch('/wallet/sync-deposits', { method: 'POST' });
      if (res.totalCreditedSats > 0) {
        addToast('success', `Credited ${res.totalCreditedSats} test satoshis!`);
        const walletInfo = await apiFetch('/wallet');
        if (walletInfo.balance) updateBalance(walletInfo.balance);
        fetchLedger();
      } else {
        addToast('info', 'No new uncredited UTXOs found on Chipnet.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet size={36} color="#0ac18e" /> Chipnet Crypto Wallet
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Manage your test satoshis, inspect deposit UTXOs, and execute test withdrawals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={openDepositModal} className="btn-gold">
            <PlusCircle size={18} /> Deposit
          </button>
          <button onClick={openWithdrawModal} className="btn-bch">
            Withdraw <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      {/* Balance Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        <div className="glass-panel-gold" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>AVAILABLE BALANCE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24' }}>
            {(balance?.availableSats ?? 0).toLocaleString()} <span style={{ fontSize: '12px' }}>SATS</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>LOCKED IN GAME/WITHDRAW</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f43f5e' }}>
            {(balance?.lockedSats ?? 0).toLocaleString()} <span style={{ fontSize: '12px' }}>SATS</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>LIFETIME DEPOSITED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0ac18e' }}>
            {(balance?.lifetimeDepositedSats ?? 0).toLocaleString()} <span style={{ fontSize: '12px' }}>SATS</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>LIFETIME WAGERED</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6' }}>
            {(balance?.lifetimeWageredSats ?? 0).toLocaleString()} <span style={{ fontSize: '12px' }}>SATS</span>
          </div>
        </div>

      </div>

      {/* Address & Deposit Info */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <div>
          <h4 style={{ fontSize: '18px', color: '#fff', marginBottom: '6px' }}>Your Chipnet Deposit Address</h4>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
            Fund this address using any Chipnet faucet to credit internal satoshis.
          </p>
          <div style={{ background: 'rgba(10,11,14,0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', width: 'fit-content' }}>
            <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#fbbf24' }}>
              {walletAddress || 'bchtest:...'}
            </span>
            <button onClick={handleCopy} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
              {copied ? <Check size={14} color="#0ac18e" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSync} disabled={syncing} className="btn-gold">
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Deposits'}
          </button>
          <a href="https://faucet.paytaca.com/" target="_blank" rel="noreferrer" className="btn-bch" style={{ textDecoration: 'none' }}>
            Open Faucet <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Ledger History Table */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h4 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="#fbbf24" /> User Balance Ledger History
        </h4>

        {ledger.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
            No transaction ledger entries recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                  <th style={{ padding: '10px' }}>Type</th>
                  <th style={{ padding: '10px' }}>Amount</th>
                  <th style={{ padding: '10px' }}>Balance After</th>
                  <th style={{ padding: '10px' }}>Reference</th>
                  <th style={{ padding: '10px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', textTransform: 'capitalize', fontWeight: 600 }}>{item.type}</td>
                    <td style={{ padding: '10px', color: item.amountSats >= 0 ? '#0ac18e' : '#f43f5e', fontWeight: 700 }}>
                      {item.amountSats >= 0 ? `+${item.amountSats}` : item.amountSats} SATS
                    </td>
                    <td style={{ padding: '10px', color: '#fbbf24' }}>{item.balanceAfterSats} SATS</td>
                    <td style={{ padding: '10px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                      {item.referenceId?.slice(0, 16)}...
                    </td>
                    <td style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>
                      {new Date(item.createdAt).toLocaleString()}
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
