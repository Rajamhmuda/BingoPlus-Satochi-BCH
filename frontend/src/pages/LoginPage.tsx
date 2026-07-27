import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { useUIStore } from '../stores/ui.store.js';
import { LogIn, Mail, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      addToast('success', 'Logged in successfully!');
      navigate('/lobby');
    } catch (err: any) {
      addToast('error', err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', padding: '0 20px' }}>
      <div className="glass-panel-gold" style={{ padding: '36px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '6px' }}>Welcome Back</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>Log in to your BingoPlus Satoshi account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gold" style={{ marginTop: '8px', width: '100%', padding: '14px' }}>
            {loading ? 'Logging in...' : 'Log In'} <LogIn size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 700 }}>
            Register Now
          </Link>
        </div>

      </div>
    </div>
  );
};
