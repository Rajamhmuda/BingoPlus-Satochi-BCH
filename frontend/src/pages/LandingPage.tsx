import React from 'react';
import { Link } from 'react-router-dom';
import { Dices, Coins, Bomb, ShieldCheck, Zap, ArrowRight, Lock } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <div className="badge-chipnet" style={{ marginBottom: '20px', fontSize: '13px', padding: '6px 16px' }}>
          ⚡ BITCOIN CASH CHIPNET DEMO CASINO
        </div>
        <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', textShadow: '0 0 30px rgba(251, 191, 36, 0.2)' }}>
          The Premier Provably Fair <br />
          <span style={{ color: '#fbbf24' }}>Bitcoin Cash Social Casino</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '680px', margin: '0 auto 36px auto' }}>
          Experience non-custodial crypto gaming with instant balance tracking, HMAC-SHA256 provably fair outcomes, and dynamic Chipnet wallet generation.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <Link to="/register" className="btn-gold" style={{ padding: '16px 36px', fontSize: '18px', textDecoration: 'none' }}>
            Play Demo Now <ArrowRight size={20} />
          </Link>
          <Link to="/fairness" className="btn-secondary" style={{ padding: '16px 28px', fontSize: '16px', textDecoration: 'none' }}>
            Verify Provable Fairness
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '80px' }}>
        
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '12px', width: 'fit-content', color: '#fbbf24', marginBottom: '20px' }}>
            <Dices size={28} />
          </div>
          <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>Satoshi Dice</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Classic multiplier dice with continuous target selection from 1.00 to 98.00 and 98% RTP.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '12px', width: 'fit-content', color: '#8b5cf6', marginBottom: '20px' }}>
            <Coins size={28} />
          </div>
          <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>Meme Slots</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Original 3-reel crypto slot machine featuring Satoshi Rocket jackpots up to 50x multiplier.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: '12px', width: 'fit-content', color: '#f43f5e', marginBottom: '20px' }}>
            <Bomb size={28} />
          </div>
          <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>Chipnet Mines</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            High-stakes 5x5 minefield grid. Uncover gems to multiply your payout or cash out anytime.
          </p>
        </div>

      </div>

      {/* Trust & Architecture Banner */}
      <div className="glass-panel-gold" style={{ padding: '40px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        <div>
          <h3 style={{ fontSize: '26px', marginBottom: '8px', color: '#fbbf24' }}>
            <ShieldCheck size={26} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            100% Cryptographically Verifiable
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '15px', maxWidth: '600px' }}>
            Every wager outcome is derived deterministically using SHA-256 precommitted server seed hashes and user client seeds. Verify any past round in seconds.
          </p>
        </div>
        <Link to="/register" className="btn-gold" style={{ textDecoration: 'none', padding: '14px 28px' }}>
          Create Free Account
        </Link>
      </div>

    </div>
  );
};
