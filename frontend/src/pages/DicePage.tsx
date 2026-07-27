import React, { useState } from 'react';
import { apiFetch } from '../lib/api-client.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useUIStore } from '../stores/ui.store.js';
import confetti from 'canvas-confetti';
import { Dices, Play, RefreshCw, ShieldCheck, HelpCircle } from 'lucide-react';

export const DicePage: React.FC = () => {
  const { balance, updateBalance } = useAuthStore();
  const { addToast } = useUIStore();

  const [wagerSats, setWagerSats] = useState<number>(500);
  const [target, setTarget] = useState<number>(50.0);
  const [direction, setDirection] = useState<'under' | 'over'>('under');
  const [clientSeed, setClientSeed] = useState<string>('satoshi_seed_1');

  const [rolling, setRolling] = useState<boolean>(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);

  // Calculations
  const winProb = direction === 'under' ? target : Number((100 - target).toFixed(2));
  const multiplier = Number((98 / winProb).toFixed(4));
  const profitSats = Math.floor(wagerSats * multiplier) - wagerSats;

  const handlePlay = async () => {
    if ((balance?.availableSats ?? 0) < wagerSats) {
      addToast('error', 'Insufficient available balance!');
      return;
    }

    setRolling(true);
    setLastResult(null);

    try {
      const idempotencyKey = `dice_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const data = await apiFetch('/games/dice/play', {
        method: 'POST',
        body: JSON.stringify({
          wagerSats,
          target,
          direction,
          clientSeed,
          idempotencyKey,
        }),
      });

      setLastRoll(data.result.roll);
      setLastResult(data);
      updateBalance({ availableSats: data.balanceAfterSats });

      if (data.result.won) {
        addToast('success', `YOU WON +${data.payoutSats} SATS! 🎉`);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else {
        addToast('info', `Roll: ${data.result.roll} — Better luck next roll!`);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Dice bet failed');
    } finally {
      setRolling(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Dices size={36} color="#fbbf24" /> Satoshi Dice
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Predict whether the provably fair roll will be under or over your target number.
          </p>
        </div>
        <span className="badge-chipnet">PROVABLY FAIR</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Left: Interactive Roll & Slider Display */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Result Display Box */}
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(10, 11, 14, 0.8)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
              {rolling ? 'ROLLING...' : lastRoll !== null ? 'RESULT ROLL' : 'SET YOUR TARGET'}
            </div>
            
            <div style={{ fontSize: '64px', fontWeight: 900, fontFamily: 'Outfit', color: lastResult?.result?.won ? '#0ac18e' : lastRoll !== null ? '#f43f5e' : '#fbbf24' }}>
              {rolling ? '??.??' : lastRoll !== null ? lastRoll.toFixed(2) : target.toFixed(2)}
            </div>

            {lastResult && (
              <div style={{ marginTop: '12px', fontSize: '15px', fontWeight: 700, color: lastResult.result.won ? '#0ac18e' : '#f43f5e' }}>
                {lastResult.result.won ? `+${lastResult.payoutSats} SATS (Win!)` : `-${wagerSats} SATS`}
              </div>
            )}
          </div>

          {/* Slider Control */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: '#94a3b8' }}>Target Roll: {target.toFixed(2)}</span>
              <span style={{ color: '#fbbf24' }}>
                Win Chance: {winProb.toFixed(2)}%
              </span>
            </div>

            <input
              type="range"
              min="2"
              max="98"
              step="0.5"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value))}
              style={{ width: '100%', height: '8px', borderRadius: '4px', accentColor: '#fbbf24', cursor: 'pointer', marginBottom: '24px' }}
            />

            {/* Quick Direction Toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setDirection('under')}
                className={direction === 'under' ? 'btn-gold' : 'btn-secondary'}
                style={{ padding: '12px' }}
              >
                Roll Under {target.toFixed(2)}
              </button>
              <button
                onClick={() => setDirection('over')}
                className={direction === 'over' ? 'btn-gold' : 'btn-secondary'}
                style={{ padding: '12px' }}
              >
                Roll Over {target.toFixed(2)}
              </button>
            </div>
          </div>

        </div>

        {/* Right: Bet Controls */}
        <div className="glass-panel-gold" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Wager Amount (Satoshis)
            </label>
            <input
              type="number"
              className="input-field"
              value={wagerSats}
              min={100}
              max={5000}
              step={100}
              onChange={(e) => setWagerSats(Math.max(100, Number(e.target.value)))}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button onClick={() => setWagerSats(100)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}>Min</button>
              <button onClick={() => setWagerSats(wagerSats * 2)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}>2x</button>
              <button onClick={() => setWagerSats(Math.floor(wagerSats / 2))} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}>½</button>
              <button onClick={() => setWagerSats(5000)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}>Max</button>
            </div>
          </div>

          <div style={{ background: 'rgba(10,11,14,0.8)', padding: '14px', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>Multiplier:</span>
              <strong style={{ color: '#fbbf24' }}>{multiplier}x</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
              <span>Profit on Win:</span>
              <strong style={{ color: '#0ac18e' }}>+{profitSats.toLocaleString()} SATS</strong>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Client Seed
            </label>
            <input
              type="text"
              className="input-field"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>

          <button onClick={handlePlay} disabled={rolling} className="btn-gold" style={{ padding: '16px', fontSize: '18px', width: '100%', marginTop: 'auto' }}>
            {rolling ? 'Rolling Dice...' : 'Roll Dice'} <Play size={20} />
          </button>

        </div>

      </div>

      {/* Provably Fair Details */}
      {lastResult?.fairness && (
        <div className="glass-panel" style={{ marginTop: '24px', padding: '20px', fontSize: '13px' }}>
          <h4 style={{ color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} /> Round Provably Fair Proof
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
            <div>Server Seed Hash: {lastResult.fairness.serverSeedHash}</div>
            <div>HMAC SHA256: {lastResult.fairness.hmacHex.slice(0, 32)}...</div>
            <div>Client Seed: {lastResult.fairness.clientSeed}</div>
            <div>Nonce: {lastResult.fairness.nonce}</div>
          </div>
        </div>
      )}

    </div>
  );
};
