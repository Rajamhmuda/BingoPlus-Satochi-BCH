import { GameAdapter, FairnessContext } from './game-adapter.js';

export interface DiceInput {
  wagerSats: number;
  target: number; // e.g. 50.00
  direction: 'under' | 'over';
  clientSeed?: string;
  idempotencyKey: string;
}

export interface DiceResult {
  roll: number; // 0.00 to 99.99
  won: boolean;
  multiplier: number;
  payoutSats: number;
}

export class DiceGame implements GameAdapter<DiceInput, DiceResult> {
  gameId = 'dice';

  validateInput(input: DiceInput, config: any): void {
    const minBet = config?.minBetSats || 100;
    const maxBet = config?.maxBetSats || 5000;

    if (!input.wagerSats || input.wagerSats < minBet || input.wagerSats > maxBet) {
      throw new Error(`Wager must be between ${minBet} and ${maxBet} satoshis.`);
    }

    if (input.target === undefined || input.target < 1.00 || input.target > 98.00) {
      throw new Error('Target roll must be between 1.00 and 98.00.');
    }

    if (!['under', 'over'].includes(input.direction)) {
      throw new Error('Direction must be under or over.');
    }

    if (!input.idempotencyKey) {
      throw new Error('Idempotency key is required.');
    }
  }

  calculateMaximumPayout(input: DiceInput, _config: any): number {
    const winProb = input.direction === 'under' ? input.target : (100 - input.target);
    const multiplier = 98 / winProb;
    return Math.floor(input.wagerSats * multiplier);
  }

  resolve(input: DiceInput, fairness: FairnessContext, _config: any): DiceResult {
    const roll = fairness.floatValue;
    const won = input.direction === 'under' ? roll < input.target : roll > input.target;

    const winProb = input.direction === 'under' ? input.target : (100 - input.target);
    const multiplier = Number((98 / winProb).toFixed(4));
    const payoutSats = won ? Math.floor(input.wagerSats * multiplier) : 0;

    return {
      roll,
      won,
      multiplier,
      payoutSats,
    };
  }

  calculatePayout(_input: DiceInput, result: DiceResult, _config: any): number {
    return result.payoutSats;
  }

  toPublicResult(result: DiceResult): unknown {
    return {
      roll: result.roll,
      won: result.won,
      multiplier: result.multiplier,
      payoutSats: result.payoutSats,
    };
  }
}

export const diceGame = new DiceGame();
