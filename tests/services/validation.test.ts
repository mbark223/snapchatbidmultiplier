import { ValidationService } from '../../src/services/validationService';
import { MultiplierConfig } from '../../src/types';

describe('ValidationService', () => {
  describe('validateMultiplierConfig', () => {
    it('should validate valid state multipliers', () => {
      const config: MultiplierConfig = {
        us_state: {
          'CA': 0.95,
          'NY': 0.85,
          'TX': 1.0
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid state codes', () => {
      const config: MultiplierConfig = {
        us_state: {
          'XX': 0.9,
          'CA': 0.8
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('us_state');
    });

    it('should reject state multipliers outside valid range', () => {
      const config: MultiplierConfig = {
        us_state: {
          CA: 0.05,
          NY: 1.2
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('us_state.CA');
      expect(errors[1].field).toBe('us_state.NY');
    });

    it('should validate valid DMA multipliers', () => {
      const config: MultiplierConfig = {
        dma: {
          'DMA_501': 0.9,
          'DMA_803': 0.85
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid DMA codes', () => {
      const config: MultiplierConfig = {
        dma: {
          'INVALID': 0.9,
          'DMA501': 0.8 // Missing underscore
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('dma');
    });

    it('should reject DMA multipliers outside valid range', () => {
      const config: MultiplierConfig = {
        dma: {
          DMA_501: 0.05,
          DMA_803: 1.5
        }
      };

      const errors = ValidationService.validateMultiplierConfig(config);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('dma.DMA_501');
      expect(errors[1].field).toBe('dma.DMA_803');
    });
  });

  describe('convertToBidMultiplierMap', () => {
    it('should convert config to flat map', () => {
      const config: MultiplierConfig = {
        us_state: { 'CA': 0.95 },
        dma: { 'DMA_501': 0.9 }
      };

      const map = ValidationService.convertToBidMultiplierMap(config);

      expect(map).toEqual({
        'CA': 0.95,
        'DMA_501': 0.9
      });
    });
  });

  describe('getTargetingVariables', () => {
    it('should return correct targeting variables', () => {
      const config: MultiplierConfig = {
        us_state: { 'CA': 0.95 },
        dma: { 'DMA_501': 0.9 }
      };

      const variables = ValidationService.getTargetingVariables(config);

      expect(variables).toContain('US_STATE');
      expect(variables).toContain('DMA');
    });

    it('should return empty array for empty config', () => {
      const config: MultiplierConfig = {};
      const variables = ValidationService.getTargetingVariables(config);
      expect(variables).toHaveLength(0);
    });
  });
});
