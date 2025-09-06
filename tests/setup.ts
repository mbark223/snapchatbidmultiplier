import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SNAPCHAT_CLIENT_ID = 'test-client-id';
process.env.SNAPCHAT_CLIENT_SECRET = 'test-client-secret';
process.env.SNAPCHAT_API_BASE_URL = 'https://adsapi.snapchat.com/v1';

// Silence console during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};