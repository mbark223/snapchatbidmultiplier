import { 
  MultiplierConfig, 
  ValidationError,
  TargetingVariable 
} from '../types';

export class ValidationService {
  private static readonly MIN_MULTIPLIER = 0.1;
  private static readonly MAX_MULTIPLIER = 1.0;
  private static readonly VALID_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  ];

  static validateMultiplierConfig(config: MultiplierConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    if (config.us_state) {
      errors.push(...this.validateStateMultipliers(config.us_state));
    }

    if (config.dma) {
      errors.push(...this.validateDMAMultipliers(config.dma));
    }

    return errors;
  }

  private static validateStateMultipliers(
    states: Record<string, number>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.entries(states).forEach(([state, multiplier]) => {
      if (!this.VALID_STATES.includes(state)) {
        errors.push({
          field: 'us_state',
          message: `Invalid state code: ${state}`,
          value: state
        });
      }

      if (!this.isValidMultiplier(multiplier)) {
        errors.push({
          field: `us_state.${state}`,
          message: `Multiplier must be between ${this.MIN_MULTIPLIER} and ${this.MAX_MULTIPLIER}`,
          value: multiplier
        });
      }
    });

    return errors;
  }

  private static validateDMAMultipliers(
    dmas: Record<string, number>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.entries(dmas).forEach(([dma, multiplier]) => {
      if (!this.isValidDMACode(dma)) {
        errors.push({
          field: 'dma',
          message: `Invalid DMA code format: ${dma}`,
          value: dma
        });
      }

      if (!this.isValidMultiplier(multiplier)) {
        errors.push({
          field: `dma.${dma}`,
          message: `Multiplier must be between ${this.MIN_MULTIPLIER} and ${this.MAX_MULTIPLIER}`,
          value: multiplier
        });
      }
    });

    return errors;
  }

  private static isValidMultiplier(value: number): boolean {
    return (
      typeof value === 'number' &&
      !isNaN(value) &&
      value >= this.MIN_MULTIPLIER &&
      value <= this.MAX_MULTIPLIER
    );
  }

  private static isValidDMACode(dma: string): boolean {
    return /^DMA_\d{3}$/.test(dma);
  }

  static convertToBidMultiplierMap(config: MultiplierConfig): Record<string, number> {
    const map: Record<string, number> = {};

    if (config.us_state) {
      Object.entries(config.us_state).forEach(([state, multiplier]) => {
        // Snapchat API requires US_STATE: prefix for state targeting
        map[`US_STATE:${state}`] = multiplier;
      });
    }

    if (config.dma) {
      Object.entries(config.dma).forEach(([dma, multiplier]) => {
        // DMA codes are already in the correct format (DMA_XXX)
        map[dma] = multiplier;
      });
    }

    return map;
  }

  static getTargetingVariables(config: MultiplierConfig): TargetingVariable[] {
    const variables: TargetingVariable[] = [];

    if (config.us_state && Object.keys(config.us_state).length > 0) {
      variables.push('US_STATE');
    }

    if (config.dma && Object.keys(config.dma).length > 0) {
      variables.push('DMA');
    }

    return variables;
  }
}
