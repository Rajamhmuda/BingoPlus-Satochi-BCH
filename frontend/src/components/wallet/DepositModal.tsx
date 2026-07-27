import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/ui.store.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { apiFetch } from '../../lib/api-client.js';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, RefreshCw, ExternalLink, Check } from 'lucide-react';

export const DepositModal: React.FC = () => {
  const { depositModalOpen, closeDepositModal, addToast } = useUIStore();
  const { walletAddress, setAuthData, updateBalance } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);

  // Automatically fetch wallet address if missing when modal opens
  useEffect(() => {
    if (depositModalOpen && !walletAddress) {
      setFetchingAddress(true);
      apiFetch('/wallet')
        .then((data) => {
          if (data?.address) {
            useAuthStore.setState({ walletAddress: data.address });
          }
          if (data?.balance) {
            updateBalance(data.balance);
          }
        })
        .catch(() => {
          apiFetch('/auth/bootstrap', { method: 'POST' })
            .then((authData) => setAuthData(authData))
            .catch((err) => console.error('Failed to auto-fetch wallet address:', err));
        })
        .finally(() => setFetchingAddress(false));
    }
  }, [depositModalOpen, walletAddress, setAuthData, updateBalance]);

  // Auto-sync deposits every 5 seconds while deposit modal is open
  useEffect(() => {
    if (!depositModalOpen) return;

    const interval = setInterval(() => {
      apiFetch('/wallet/sync-deposits', { method: 'POST' })
        .then((res) => {
          if (res && res.totalCreditedSats > 0) {
            addToast('success', `⚡ Auto-Credited +${res.totalCreditedSats} Chipnet SATS!`);
            apiFetch('/wallet').then((w) => {
              if (w?.balance) updateBalance(w.balance);
            });
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [depositModalOpen, addToast, updateBalance]);

  if (!depositModalOpen) return null;

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
      if (res && res.totalCreditedSats > 0) {
        addToast('success', `Credited ${res.totalCreditedSats} test satoshis!`);
        const walletInfo = await apiFetch('/wallet');
        if (walletInfo?.balance) {
          updateBalance(walletInfo.balance);
        }
      } else {
        addToast('info', 'No new uncredited Chipnet UTXOs found yet.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Deposit sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel-gold" style={{ maxWidth: '440px', width: '100%', padding: '28px', position: 'relative' }}>
        
        <button onClick={closeDepositModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '22px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚡ Deposit Chipnet BCH
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
          Send test satoshis from any Bitcoin Cash Chipnet wallet or faucet to your personal deposit address.
        </p>

        {/* QR Code */}
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', width: 'fit-content', margin: '0 auto 20px auto' }}>
          {walletAddress ? (
            <QRCodeSVG value={walletAddress} size={160} />
          ) : (
            <div style={{ width: 160, height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#000', gap: '8px', fontSize: '13px' }}>
              <RefreshCw size={24} className="animate-spin" color="#d97706" />
              <span>{fetchingAddress ? 'Fetching Address...' : 'Generating Address...'}</span>
            </div>
          )}
        </div>

        {/* Address Copy Box */}
        <div style={{ background: 'rgba(10,11,14,0.8)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#fbbf24', wordBreak: 'break-all' }}>
            {walletAddress || (fetchingAddress ? 'Fetching...' : 'bchtest:...')}
          </span>
          <button onClick={handleCopy} disabled={!walletAddress} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
            {copied ? <Check size={14} color="#0ac18e" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleSync} disabled={syncing || !walletAddress} className="btn-gold" style={{ width: '100%' }}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Scanning Chipnet...' : 'Sync Deposit Now'}
          </button>

          <a href="https://faucet.paytaca.com/" target="_blank" rel="noreferrer" className="btn-bch" style={{ width: '100%', textDecoration: 'none' }}>
            Get Free Chipnet BCH Faucet <ExternalLink size={16} />
          </a>
        </div>

      </div>
    </div>
  );
};
