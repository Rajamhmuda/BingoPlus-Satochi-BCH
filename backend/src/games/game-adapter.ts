export interface FairnessContext {
  floatValue: number; // 0.00 to 99.99
  intValue: number;   // 0 to 9999
}

export interface GameAdapter<TInput, TResult> {
  gameId: string;
  validateInput(input: TInput, config: any): void;
  calculateMaximumPayout(input: TInput, config: any): number;
  resolve(input: TInput, fairness: FairnessContext, config: any): TResult;
  calculatePayout(input: TInput, result: TResult, config: any): number;
  toPublicResult(result: TResult): unknown;
}
