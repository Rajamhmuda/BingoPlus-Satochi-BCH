import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-client.js';
import { useUIStore } from '../stores/ui.store.js';
import { Shield, Pause, Play, RefreshCw, ToggleLeft, ToggleRight, Users, Dices, ArrowUpRight } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [games, setGames] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [dashData, gamesData] = await Promise.all([
        apiFetch('/admin/dashboard'),
        apiFetch('/games'),
      ]);
      setDashboard(dashData);
      setGames(gamesData);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePauseToggle = async () => {
    if (!dashboard) return;
    const newStatus = !dashboard.bettingEnabled;
    try {
      await apiFetch('/admin/system/pause', {
        method: 'POST',
        body: JSON.stringify({ enabled: newStatus }),
      });
      addToast('success', `Global betting set to ${newStatus ? 'ENABLED' : 'PAUSED'}`);
      fetchAdminData();
    } catch (err: any) {
      addToast('error', err.message || 'Action failed');
    }
  };

  const handleGameToggle = async (gameId: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/admin/games/${gameId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      addToast('success', `Game ${gameId} toggled successfully`);
      fetchAdminData();
    } catch (err: any) {
      addToast('error', err.message || 'Game toggle failed');
    }
  };

  const handleSeedRotate = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/fairness/rotate', { method: 'POST' });
      addToast('success', 'Server seed rotated & previous seed disclosed!');
      fetchAdminData();
    } catch (err: any) {
      addToast('error', err.message || 'Seed rotation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={36} color="#fbbf24" /> Administrator Control Panel
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Manage platform controls, emergency pause, game states, and seed rotations.
          </p>
        </div>
        <span className="badge-chipnet">ADMIN ROLE</span>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>REGISTERED USERS</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#3b82f6" /> {dashboard?.totalUsers ?? 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>TOTAL BETS RESOLVED</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Dices size={24} color="#fbbf24" /> {dashboard?.totalBets ?? 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>TOTAL WITHDRAWALS</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0ac18e', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowUpRight size={24} color="#0ac18e" /> {dashboard?.totalWithdrawals ?? 0}
          </div>
        </div>

        <div className="glass-panel-gold" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>BETTING ENGINE STATUS</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: dashboard?.bettingEnabled ? '#0ac18e' : '#f43f5e' }}>
            {dashboard?.bettingEnabled ? '● ONLINE' : 'PAUSED'}
          </div>
        </div>

      </div>

      {/* Control Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Global Pause Control */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h4 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>Emergency Pause Control</h4>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
            Immediately pause or resume all game wagers across the entire platform.
          </p>
          <button
            onClick={handlePauseToggle}
            className={dashboard?.bettingEnabled ? 'btn-secondary' : 'btn-gold'}
            style={{ width: '100%', padding: '14px', border: dashboard?.bettingEnabled ? '1px solid #f43f5e' : undefined, color: dashboard?.bettingEnabled ? '#f43f5e' : undefined }}
          >
            {dashboard?.bettingEnabled ? (
              <> <Pause size={18} /> Emergency Pause Betting </>
            ) : (
              <> <Play size={18} /> Resume Global Betting </>
            )}
          </button>
        </div>

        {/* Seed Rotation */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h4 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>Rotate Server Seed</h4>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
            Rotate the server seed, disclose the previous plaintext seed, and publish a new SHA-256 pre-commitment.
          </p>
          <button onClick={handleSeedRotate} disabled={loading} className="btn-gold" style={{ width: '100%', padding: '14px' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> {loading ? 'Rotating Seed...' : 'Rotate & Disclose Seed'}
          </button>
        </div>

      </div>

      {/* Game Management Toggles */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h4 style={{ fontSize: '18px', marginBottom: '16px', color: '#fff' }}>Game Module Status & Controls</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {games && Object.keys(games).map((gameId) => {
            const game = games[gameId];
            const isEnabled = game.enabled !== false;
            return (
              <div key={gameId} style={{ background: 'rgba(10,11,14,0.8)', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
                    {game.name || gameId}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Min: {game.minBetSats || 100} SATS | Max: {game.maxBetSats || 5000} SATS
                  </div>
                </div>

                <button
                  onClick={() => handleGameToggle(gameId, isEnabled)}
                  className={isEnabled ? 'btn-gold' : 'btn-secondary'}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {isEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} {isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
