import React, { useState } from 'react';
import { apiFetch } from '../lib/api-client.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useUIStore } from '../stores/ui.store.js';
import confetti from 'canvas-confetti';
import { Bomb, Gem, Play, DollarSign } from 'lucide-react';

export const MinesPage: React.FC = () => {
  const { balance, updateBalance } = useAuthStore();
  const { addToast } = useUIStore();

  const [wagerSats, setWagerSats] = useState<number>(500);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [clientSeed, setClientSeed] = useState<string>('satoshi_mines_1');

  const [gameState, setGameState] = useState<'idle' | 'active' | 'busted' | 'cashed_out'>('idle');
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);

  const handleStart = async () => {
    if ((balance?.availableSats ?? 0) < wagerSats) {
      addToast('error', 'Insufficient available balance!');
      return;
    }

    setLoading(true);
    setRevealedTiles([]);
    setMinePositions([]);

    try {
      const data = await apiFetch('/games/mines/start', {
        method: 'POST',
        body: JSON.stringify({
          wagerSats,
          minesCount,
          clientSeed,
        }),
      });

      setGameState('active');
      setCurrentMultiplier(data.currentMultiplier);
      addToast('info', `Mines game started with ${minesCount} mines!`);
      
      // Refresh balance
      const walletInfo = await apiFetch('/wallet');
      if (walletInfo.balance) updateBalance(walletInfo.balance);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to start Mines game');
    } finally {
      setLoading(false);
    }
  };

  const handleTileClick = async (tileIndex: number) => {
    if (gameState !== 'active' || revealedTiles.includes(tileIndex) || loading) return;

    setLoading(true);

    try {
      const data = await apiFetch('/games/mines/reveal', {
        method: 'POST',
        body: JSON.stringify({ tileIndex }),
      });

      setRevealedTiles(data.revealedTiles);
      setCurrentMultiplier(data.currentMultiplier);

      if (data.hitMine) {
        setGameState('busted');
        setMinePositions(data.minePositions || []);
        addToast('error', 'BOOM! You hit a mine!');
        const walletInfo = await apiFetch('/wallet');
        if (walletInfo.balance) updateBalance(walletInfo.balance);
      } else {
        addToast('success', `Gem uncovered! Multiplier: ${data.currentMultiplier}x`);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reveal tile');
    } finally {
      setLoading(false);
    }
  };

  const handleCashout = async () => {
    if (gameState !== 'active' || revealedTiles.length === 0 || loading) return;

    setLoading(true);

    try {
      const data = await apiFetch('/games/mines/cashout', { method: 'POST' });

      setGameState('cashed_out');
      setMinePositions(data.minePositions || []);
      updateBalance({ availableSats: data.balanceAfterSats });
      addToast('success', `CASHED OUT +${data.payoutSats} SATS! 🎉`);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch (err: any) {
      addToast('error', err.message || 'Cashout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bomb size={36} color="#f43f5e" /> Chipnet Mines
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Uncover safe gems on the 5x5 grid. Increase your multiplier with every gem!
          </p>
        </div>
        <span className="badge-chipnet">INTERACTIVE GRID</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Left: 5x5 Mines Grid */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
              maxWidth: '420px',
              width: '100%',
              aspectRatio: '1',
              marginBottom: '24px',
            }}
          >
            {Array.from({ length: 25 }, (_, i) => {
              const isRevealed = revealedTiles.includes(i);
              const isMine = minePositions.includes(i);

              let content = null;
              let bg = 'rgba(255, 255, 255, 0.05)';
              let border = '1px solid var(--border-color)';

              if (isRevealed) {
                bg = 'rgba(10, 193, 142, 0.2)';
                border = '1px solid #0ac18e';
                content = <Gem size={28} color="#0ac18e" />;
              } else if (isMine) {
                bg = 'rgba(244, 63, 94, 0.25)';
                border = '1px solid #f43f5e';
                content = <Bomb size={28} color="#f43f5e" />;
              }

              return (
                <button
                  key={i}
                  onClick={() => handleTileClick(i)}
                  disabled={gameState !== 'active' || isRevealed || loading}
                  style={{
                    background: bg,
                    border,
                    borderRadius: '12px',
                    cursor: gameState === 'active' && !isRevealed ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* Active Cashout Bar */}
          {gameState === 'active' && (
            <button
              onClick={handleCashout}
              disabled={revealedTiles.length === 0 || loading}
              className="btn-gold"
              style={{ width: '100%', maxWidth: '420px', padding: '16px', fontSize: '18px' }}
            >
              Cash Out {Math.floor(wagerSats * currentMultiplier).toLocaleString()} SATS ({currentMultiplier}x)
            </button>
          )}

        </div>

        {/* Right: Controls */}
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
              disabled={gameState === 'active'}
              onChange={(e) => setWagerSats(Math.max(100, Number(e.target.value)))}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Number of Mines: {minesCount}
            </label>
            <input
              type="range"
              min="1"
              max="24"
              value={minesCount}
              disabled={gameState === 'active'}
              onChange={(e) => setMinesCount(Number(e.target.value))}
              style={{ width: '100%', height: '8px', accentColor: '#f43f5e' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Client Seed
            </label>
            <input
              type="text"
              className="input-field"
              value={clientSeed}
              disabled={gameState === 'active'}
              onChange={(e) => setClientSeed(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>

          {gameState !== 'active' && (
            <button onClick={handleStart} disabled={loading} className="btn-gold" style={{ padding: '16px', fontSize: '18px', width: '100%', marginTop: 'auto' }}>
              {loading ? 'Starting...' : 'Start Game'} <Play size={20} />
            </button>
          )}

        </div>

      </div>

    </div>
  );
};
