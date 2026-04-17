/**
 * Jest Test Setup
 * Configures testing environment before tests run
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/sawaikar-test';

// Suppress console output during tests (set false for debugging)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
};

// Increase test timeout for slower operations
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setImmediate(resolve));
});
