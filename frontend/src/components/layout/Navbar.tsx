import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store.js';
import { useUIStore } from '../../stores/ui.store.js';
import { auth } from '../../lib/firebase.js';
import { signOut } from 'firebase/auth';
import { Dices, Coins, Bomb, Wallet, ShieldCheck, LogOut, User, PlusCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, balance, firebaseUser } = useAuthStore();
  const { openDepositModal } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <Link to={firebaseUser ? '/lobby' : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', padding: '8px 12px', borderRadius: '10px', fontWeight: '900', color: '#000', fontSize: '20px' }}>
            BPS
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '20px', color: '#fff', lineHeight: 1.1 }}>
              BingoPlus <span style={{ color: '#fbbf24' }}>Satoshi</span>
            </div>
            <div className="badge-chipnet" style={{ fontSize: '10px', padding: '2px 8px', marginTop: '2px' }}>
              CHIPNET DEMO
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        {firebaseUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/lobby" style={{ color: '#f8fafc', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Lobby
            </Link>
            <Link to="/dice" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Dices size={18} color="#fbbf24" /> Dice
            </Link>
            <Link to="/slots" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coins size={18} color="#8b5cf6" /> Slots
            </Link>
            <Link to="/mines" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bomb size={18} color="#f43f5e" /> Mines
            </Link>
            <Link to="/wallet" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={18} color="#0ac18e" /> Wallet
            </Link>
            <Link to="/fairness" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} color="#3b82f6" /> Fair
            </Link>
            <Link to="/audit" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Audit
            </Link>
            {profile?.role === 'admin' && (
              <Link to="/admin" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
                Admin
              </Link>
            )}
          </div>
        )}

        {/* Right Section: Balance & User */}
        {firebaseUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'rgba(10, 11, 14, 0.8)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '6px 14px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>
                ⚡ {(balance?.availableSats ?? 0).toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8' }}>SATS</span>
              </div>
              <button onClick={openDepositModal} className="btn-gold" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '20px' }}>
                <PlusCircle size={14} /> Deposit
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
              <User size={16} /> {profile?.displayName || 'Player'}
            </div>

            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Log In
            </Link>
            <Link to="/register" className="btn-gold" style={{ textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        )}

      </div>
    </nav>
  );
};
