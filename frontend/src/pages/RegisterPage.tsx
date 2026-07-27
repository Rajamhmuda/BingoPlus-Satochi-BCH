import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { useUIStore } from '../stores/ui.store.js';
import { apiFetch } from '../lib/api-client.js';
import { UserPlus, Mail, Lock, User, CheckSquare } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageAck, setAgeAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast('error', 'Passwords do not match');
      return;
    }

    if (!ageAck) {
      addToast('error', 'You must acknowledge this is a Chipnet demo application.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Bootstrap backend account & Chipnet wallet
      await apiFetch('/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      });

      addToast('success', 'Account registered & Chipnet wallet generated!');
      navigate('/lobby');
    } catch (err: any) {
      addToast('error', err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 20px' }}>
      <div className="glass-panel-gold" style={{ padding: '36px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '6px' }}>Create Account</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Get 50,000 free Chipnet Satoshi demo credits</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Display Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="SatoshiKing"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <User size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                placeholder="satoshi@bitcoin.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="ageAck"
              checked={ageAck}
              onChange={(e) => setAgeAck(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#fbbf24', cursor: 'pointer' }}
            />
            <label htmlFor="ageAck" style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer', lineHeight: 1.3 }}>
              I acknowledge that this is a <strong>Chipnet testnet demo</strong> with zero real-money value.
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-gold" style={{ marginTop: '10px', width: '100%', padding: '14px' }}>
            {loading ? 'Creating Account...' : 'Register & Get Chipnet Wallet'} <UserPlus size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 700 }}>
            Log In
          </Link>
        </div>

      </div>
    </div>
  );
};
