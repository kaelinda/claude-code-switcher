// Set up test environment
process.env.NODE_ENV = 'test';

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set up global test utilities
(global as any).testHelpers = {
  // Clean up environment variables after tests
  cleanupEnv: () => {
    const envVars = [
      'ANTHROPIC_AUTH_TOKEN',
      'ANTHROPIC_BASE_URL',
      'ANTHROPIC_MODEL',
      'HOME',
      'SHELL'
    ];
    
    envVars.forEach(key => {
      delete process.env[key];
    });
  },
  
  // Create test provider configuration
  createTestProvider: (overrides = {}) => ({
    name: 'Test Provider',
    api_key: 'test-api-key',
    base_url: 'https://test.com',
    model: 'test-model',
    ...overrides
  }),
  
  // Create test environment configuration
  createTestEnvConfig: (overrides = {}) => ({
    ANTHROPIC_AUTH_TOKEN: 'test-token',
    ANTHROPIC_BASE_URL: 'https://test.com',
    ANTHROPIC_MODEL: 'test-model',
    ...overrides
  })
};