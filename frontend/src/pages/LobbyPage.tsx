import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store.js';
import { useUIStore } from '../stores/ui.store.js';
import { db } from '../lib/firebase.js';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { Dices, Coins, Bomb, Wallet, PlusCircle, ArrowUpRight, ShieldCheck, Flame } from 'lucide-react';

export const LobbyPage: React.FC = () => {
  const { profile, balance, walletAddress } = useAuthStore();
  const { openDepositModal, openWithdrawModal } = useUIStore();
  const [recentBets, setRecentBets] = useState<any[]>([]);

  useEffect(() => {
    const betsRef = query(ref(db, 'public/recentBets'), limitToLast(15));
    const unsubscribe = onValue(betsRef, (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const betsList = Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt);
        setRecentBets(betsList);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Welcome Hero Banner */}
      <div className="glass-panel-gold" style={{ padding: '32px', marginBottom: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>
            CASINO DASHBOARD
          </div>
          <h2 style={{ fontSize: '32px', color: '#fff', marginBottom: '8px' }}>
            Welcome back, <span style={{ color: '#fbbf24' }}>{profile?.displayName || 'Player'}</span>!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', fontFamily: 'monospace' }}>
            Chipnet Address: <span style={{ color: '#0ac18e' }}>{walletAddress || 'Loading...'}</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={openDepositModal} className="btn-gold">
            <PlusCircle size={18} /> Deposit Faucet Sats
          </button>
          <button onClick={openWithdrawModal} className="btn-secondary">
            Withdraw <ArrowUpRight size={18} />
          </button>
        </div>
      </div>

      {/* Game Cards Section */}
      <h3 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Flame color="#fbbf24" /> Popular Provably Fair Games
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Dice Card */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '12px', borderRadius: '12px' }}>
                <Dices size={32} />
              </div>
              <span className="badge-chipnet">98% RTP</span>
            </div>
            <h4 style={{ fontSize: '22px', marginBottom: '8px' }}>Satoshi Dice</h4>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Classic multiplier dice. Pick target roll from 1 to 98 and win up to 98x payout!
            </p>
          </div>
          <Link to="/dice" className="btn-gold" style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>
            Play Dice Now
          </Link>
        </div>

        {/* Slots Card */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', padding: '12px', borderRadius: '12px' }}>
                <Coins size={32} />
              </div>
              <span className="badge-chipnet">50x JACKPOT</span>
            </div>
            <h4 style={{ fontSize: '22px', marginBottom: '8px' }}>Meme Slots</h4>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              3-Reel crypto slots. Match Satoshi Rockets, BCH Chips, and Diamonds for big wins.
            </p>
          </div>
          <Link to="/slots" className="btn-gold" style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>
            Play Slots Now
          </Link>
        </div>

        {/* Mines Card */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', padding: '12px', borderRadius: '12px' }}>
                <Bomb size={32} />
              </div>
              <span className="badge-chipnet">CUSTOM MINES</span>
            </div>
            <h4 style={{ fontSize: '22px', marginBottom: '8px' }}>Chipnet Mines</h4>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Uncover hidden gems across a 5x5 grid without hitting bombs. Cash out anytime!
            </p>
          </div>
          <Link to="/mines" className="btn-gold" style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>
            Play Mines Now
          </Link>
        </div>

      </div>

      {/* Live Recent Bets Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚡ Live Bets Feed
        </h4>

        {recentBets.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No recent bets recorded yet. Place the first bet!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                  <th style={{ padding: '10px' }}>Game</th>
                  <th style={{ padding: '10px' }}>Player</th>
                  <th style={{ padding: '10px' }}>Wager</th>
                  <th style={{ padding: '10px' }}>Multiplier</th>
                  <th style={{ padding: '10px' }}>Payout</th>
                </tr>
              </thead>
              <tbody>
                {recentBets.map((bet) => (
                  <tr key={bet.betId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', textTransform: 'capitalize', fontWeight: 600 }}>{bet.gameId}</td>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{bet.maskedPlayerName}</td>
                    <td style={{ padding: '10px' }}>{bet.wagerSats} SATS</td>
                    <td style={{ padding: '10px', color: bet.payoutSats > 0 ? '#fbbf24' : '#64748b' }}>
                      {bet.multiplier ? `${bet.multiplier}x` : '0x'}
                    </td>
                    <td style={{ padding: '10px', color: bet.payoutSats > 0 ? '#0ac18e' : '#f43f5e', fontWeight: 700 }}>
                      {bet.payoutSats > 0 ? `+${bet.payoutSats} SATS` : '0 SATS'}
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
