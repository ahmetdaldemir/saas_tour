/**
 * Jest Test Setup
 * Configure test environment and global mocks
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
  // Optionally silence console during tests
  // Uncomment if you want to suppress console output
  // console.log = jest.fn();
  // console.info = jest.fn();
  // console.warn = jest.fn();
  // console.error = jest.fn();
});

afterAll(() => {
  // Restore original console
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(10000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

