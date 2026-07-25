export interface CalculationStep {
  readonly label: string;
  readonly value: number;
  readonly source?: string;
}

export interface CalculationResult<T> {
  readonly value: T;
  readonly steps: readonly CalculationStep[];
}

export interface FlatModifier {
  readonly source: string;
  readonly amount: number;
}

export class CharacterValidationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CharacterValidationError';
  }
}
