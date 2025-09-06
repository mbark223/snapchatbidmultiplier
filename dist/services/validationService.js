"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
class ValidationService {
    static validateMultiplierConfig(config) {
        const errors = [];
        if (config.gender) {
            errors.push(...this.validateGenderMultipliers(config.gender));
        }
        if (config.age) {
            errors.push(...this.validateAgeMultipliers(config.age));
        }
        if (config.us_state) {
            errors.push(...this.validateStateMultipliers(config.us_state));
        }
        if (config.dma) {
            errors.push(...this.validateDMAMultipliers(config.dma));
        }
        return errors;
    }
    static validateGenderMultipliers(genders) {
        const errors = [];
        Object.entries(genders).forEach(([gender, multiplier]) => {
            if (!this.VALID_GENDERS.includes(gender)) {
                errors.push({
                    field: 'gender',
                    message: `Invalid gender value: ${gender}`,
                    value: gender
                });
            }
            if (!this.isValidMultiplier(multiplier)) {
                errors.push({
                    field: `gender.${gender}`,
                    message: `Multiplier must be between ${this.MIN_MULTIPLIER} and ${this.MAX_MULTIPLIER}`,
                    value: multiplier
                });
            }
        });
        return errors;
    }
    static validateAgeMultipliers(ages) {
        const errors = [];
        Object.entries(ages).forEach(([ageRange, multiplier]) => {
            if (!this.VALID_AGE_RANGES.includes(ageRange)) {
                errors.push({
                    field: 'age',
                    message: `Invalid age range: ${ageRange}`,
                    value: ageRange
                });
            }
            if (!this.isValidMultiplier(multiplier)) {
                errors.push({
                    field: `age.${ageRange}`,
                    message: `Multiplier must be between ${this.MIN_MULTIPLIER} and ${this.MAX_MULTIPLIER}`,
                    value: multiplier
                });
            }
        });
        return errors;
    }
    static validateStateMultipliers(states) {
        const errors = [];
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
    static validateDMAMultipliers(dmas) {
        const errors = [];
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
    static isValidMultiplier(value) {
        return (typeof value === 'number' &&
            !isNaN(value) &&
            value >= this.MIN_MULTIPLIER &&
            value <= this.MAX_MULTIPLIER);
    }
    static isValidDMACode(dma) {
        return /^DMA_\d{3}$/.test(dma);
    }
    static convertToBidMultiplierMap(config) {
        const map = {};
        if (config.gender) {
            Object.entries(config.gender).forEach(([gender, multiplier]) => {
                map[gender] = multiplier;
            });
        }
        if (config.age) {
            Object.entries(config.age).forEach(([age, multiplier]) => {
                map[age] = multiplier;
            });
        }
        if (config.us_state) {
            Object.entries(config.us_state).forEach(([state, multiplier]) => {
                map[state] = multiplier;
            });
        }
        if (config.dma) {
            Object.entries(config.dma).forEach(([dma, multiplier]) => {
                map[dma] = multiplier;
            });
        }
        return map;
    }
    static getTargetingVariables(config) {
        const variables = [];
        if (config.gender && Object.keys(config.gender).length > 0) {
            variables.push('GENDER');
        }
        if (config.age && Object.keys(config.age).length > 0) {
            variables.push('AGE');
        }
        if (config.us_state && Object.keys(config.us_state).length > 0) {
            variables.push('US_STATE');
        }
        if (config.dma && Object.keys(config.dma).length > 0) {
            variables.push('DMA');
        }
        return variables;
    }
}
exports.ValidationService = ValidationService;
ValidationService.MIN_MULTIPLIER = 0.1;
ValidationService.MAX_MULTIPLIER = 10.0;
ValidationService.VALID_GENDERS = ['male', 'female', 'unknown'];
ValidationService.VALID_AGE_RANGES = [
    '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];
ValidationService.VALID_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];
