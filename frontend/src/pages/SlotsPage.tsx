import React, { useState } from 'react';
import { apiFetch } from '../lib/api-client.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useUIStore } from '../stores/ui.store.js';
import confetti from 'canvas-confetti';
import { Coins, Play, Trophy } from 'lucide-react';

const ALL_SYMBOLS = ['🚀', '💎', '🎰', '⚡', '🍋', '🍒'];

export const SlotsPage: React.FC = () => {
  const { balance, updateBalance } = useAuthStore();
  const { addToast } = useUIStore();

  const [wagerSats, setWagerSats] = useState<number>(500);
  const [clientSeed, setClientSeed] = useState<string>('satoshi_slots_1');
  const [spinning, setSpinning] = useState<boolean>(false);
  
  const [reels, setReels] = useState<[string, string, string]>(['🎰', '🚀', '💎']);
  const [lastResult, setLastResult] = useState<any | null>(null);

  const handleSpin = async () => {
    if ((balance?.availableSats ?? 0) < wagerSats) {
      addToast('error', 'Insufficient available balance!');
      return;
    }

    setSpinning(true);
    setLastResult(null);

    // Reel spin animation timer
    const spinInterval = setInterval(() => {
      setReels([
        ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
        ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
        ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
      ]);
    }, 80);

    try {
      const idempotencyKey = `slots_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const data = await apiFetch('/games/slots/play', {
        method: 'POST',
        body: JSON.stringify({
          wagerSats,
          clientSeed,
          idempotencyKey,
        }),
      });

      setTimeout(() => {
        clearInterval(spinInterval);
        setReels(data.result.reels);
        setLastResult(data);
        updateBalance({ availableSats: data.balanceAfterSats });

        if (data.result.won) {
          addToast('success', `${data.result.matchedPattern}! WON +${data.payoutSats} SATS! 🎉`);
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        } else {
          addToast('info', 'No match this spin. Try again!');
        }
        setSpinning(false);
      }, 1000);

    } catch (err: any) {
      clearInterval(spinInterval);
      setSpinning(false);
      addToast('error', err.message || 'Slots spin failed');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Coins size={36} color="#8b5cf6" /> Meme Slots
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Spin the 3-reel Meme slot machine. Hit 3 Satoshi Rockets for 50x Jackpot!
          </p>
        </div>
        <span className="badge-chipnet">JACKPOT 50X</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Left: 3-Reel Display */}
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
            {reels.map((sym, idx) => (
              <div
                key={idx}
                style={{
                  width: '120px',
                  height: '140px',
                  background: 'linear-gradient(180deg, #12141c 0%, #0a0b0e 100%)',
                  border: '2px solid var(--border-gold)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '60px',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 20px rgba(251,191,36,0.2)',
                  transition: 'transform 0.1s ease',
                }}
              >
                {sym}
              </div>
            ))}
          </div>

          {/* Outcome Result Card */}
          {lastResult && (
            <div style={{ padding: '16px 28px', background: lastResult.result.won ? 'rgba(10,193,142,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${lastResult.result.won ? '#0ac18e' : 'var(--border-color)'}`, borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: lastResult.result.won ? '#0ac18e' : '#94a3b8' }}>
                {lastResult.result.matchedPattern}
              </div>
              <div style={{ fontSize: '14px', color: '#fbbf24', marginTop: '4px' }}>
                {lastResult.result.won ? `Payout: +${lastResult.payoutSats} SATS (${lastResult.result.multiplier}x)` : '0 SATS'}
              </div>
            </div>
          )}

        </div>

        {/* Right: Bet Controls & Paytable */}
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
          </div>

          {/* Paytable */}
          <div style={{ background: 'rgba(10,11,14,0.8)', padding: '14px', borderRadius: '10px', fontSize: '12px' }}>
            <div style={{ fontWeight: 800, color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trophy size={14} /> Paytable Multipliers
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: '#94a3b8' }}>
              <div>🚀🚀🚀: 50x</div>
              <div>💎💎💎: 25x</div>
              <div>🎰🎰🎰: 10x</div>
              <div>⚡⚡⚡: 5x</div>
              <div>🍋🍋🍋: 3x</div>
              <div>🍒🍒🍒: 2x</div>
            </div>
          </div>



          <button onClick={handleSpin} disabled={spinning} className="btn-gold" style={{ padding: '16px', fontSize: '18px', width: '100%', marginTop: 'auto' }}>
            {spinning ? 'Spinning Reels...' : 'Spin Slots'} <Play size={20} />
          </button>

        </div>

      </div>

    </div>
  );
};
