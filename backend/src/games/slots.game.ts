import { GameAdapter, FairnessContext } from './game-adapter.js';

export interface SlotsInput {
  wagerSats: number;
  clientSeed?: string;
  idempotencyKey: string;
}

export interface SlotsResult {
  reels: [string, string, string];
  matchedPattern: string;
  multiplier: number;
  payoutSats: number;
  won: boolean;
}

const SYMBOLS = ['🚀', '💎', '🎰', '⚡', '🍋', '🍒'];

export class SlotsGame implements GameAdapter<SlotsInput, SlotsResult> {
  gameId = 'slots';

  validateInput(input: SlotsInput, config: any): void {
    const minBet = config?.minBetSats || 100;
    const maxBet = config?.maxBetSats || 5000;

    if (!input.wagerSats || input.wagerSats < minBet || input.wagerSats > maxBet) {
      throw new Error(`Wager must be between ${minBet} and ${maxBet} satoshis.`);
    }

    if (!input.idempotencyKey) {
      throw new Error('Idempotency key is required.');
    }
  }

  calculateMaximumPayout(input: SlotsInput, _config: any): number {
    return input.wagerSats * 50; // Max multiplier is 50x (🚀🚀🚀)
  }

  resolve(input: SlotsInput, fairness: FairnessContext, _config: any): SlotsResult {
    // Derive 3 reel indices from floatValue & intValue
    const seedInt = fairness.intValue;
    const idx1 = seedInt % 6;
    const idx2 = Math.floor(seedInt / 6) % 6;
    const idx3 = Math.floor(seedInt / 36) % 6;

    const reels: [string, string, string] = [SYMBOLS[idx1], SYMBOLS[idx2], SYMBOLS[idx3]];

    let multiplier = 0;
    let matchedPattern = 'No match';

    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      const sym = reels[0];
      if (sym === '🚀') multiplier = 50;
      else if (sym === '💎') multiplier = 25;
      else if (sym === '🎰') multiplier = 10;
      else if (sym === '⚡') multiplier = 5;
      else if (sym === '🍋') multiplier = 3;
      else if (sym === '🍒') multiplier = 2;
      matchedPattern = `3x ${sym} Jackpot!`;
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      const matchedSym = reels[0] === reels[1] ? reels[0] : reels[2];
      if (matchedSym === '🚀') multiplier = 5;
      else if (matchedSym === '💎') multiplier = 3;
      else if (matchedSym === '🎰') multiplier = 2;
      else multiplier = 1.2;
      matchedPattern = `2x ${matchedSym} Match`;
    }

    const won = multiplier > 0;
    const payoutSats = won ? Math.floor(input.wagerSats * multiplier) : 0;

    return {
      reels,
      matchedPattern,
      multiplier,
      payoutSats,
      won,
    };
  }

  calculatePayout(_input: SlotsInput, result: SlotsResult, _config: any): number {
    return result.payoutSats;
  }

  toPublicResult(result: SlotsResult): unknown {
    return {
      reels: result.reels,
      matchedPattern: result.matchedPattern,
      multiplier: result.multiplier,
      payoutSats: result.payoutSats,
      won: result.won,
    };
  }
}

export const slotsGame = new SlotsGame();
