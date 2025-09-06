import { ValidationService } from '../../src/services/validationService';
import { MultiplierConfig } from '../../src/types';

describe('ValidationService', () => {
  describe('validateMultiplierConfig', () => {
    it('should validate valid gender multipliers', () => {
      const config: MultiplierConfig = {
        gender: {
          male: 1.5,
          female: 0.8,
          unknown: 1.0
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid gender values', () => {
      const config: any = {
        gender: {
          invalid: 1.5
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('gender');
    });

    it('should reject multipliers outside valid range', () => {
      const config: MultiplierConfig = {
        gender: {
          male: 11.0, // Too high
          female: 0.05 // Too low
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('gender.male');
      expect(errors[1].field).toBe('gender.female');
    });

    it('should validate valid age multipliers', () => {
      const config: MultiplierConfig = {
        age: {
          '18-24': 1.2,
          '25-34': 1.0,
          '35-44': 0.9
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should validate valid state multipliers', () => {
      const config: MultiplierConfig = {
        us_state: {
          'CA': 1.1,
          'NY': 1.3,
          'TX': 0.9
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid state codes', () => {
      const config: MultiplierConfig = {
        us_state: {
          'XX': 1.1,
          'CA': 1.2
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('us_state');
    });

    it('should validate valid DMA multipliers', () => {
      const config: MultiplierConfig = {
        dma: {
          'DMA_501': 1.2,
          'DMA_803': 0.9
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid DMA codes', () => {
      const config: MultiplierConfig = {
        dma: {
          'INVALID': 1.1,
          'DMA501': 1.2 // Missing underscore
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('dma');
    });
  });

  describe('convertToBidMultiplierMap', () => {
    it('should convert config to flat map', () => {
      const config: MultiplierConfig = {
        gender: { male: 1.2, female: 0.8 },
        age: { '18-24': 1.5 },
        us_state: { 'CA': 1.1 },
        dma: { 'DMA_501': 0.9 }
      };

      const map = ValidationService.convertToBidMultiplierMap(config);

      expect(map).toEqual({
        male: 1.2,
        female: 0.8,
        '18-24': 1.5,
        'CA': 1.1,
        'DMA_501': 0.9
      });
    });
  });

  describe('getTargetingVariables', () => {
    it('should return correct targeting variables', () => {
      const config: MultiplierConfig = {
        gender: { male: 1.2 },
        age: { '18-24': 1.5 },
        us_state: { 'CA': 1.1 }
      };

      const variables = ValidationService.getTargetingVariables(config);

      expect(variables).toContain('GENDER');
      expect(variables).toContain('AGE');
      expect(variables).toContain('US_STATE');
      expect(variables).not.toContain('DMA');
    });

    it('should return empty array for empty config', () => {
      const config: MultiplierConfig = {};
      const variables = ValidationService.getTargetingVariables(config);
      expect(variables).toHaveLength(0);
    });
  });
});