import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { 
  loadProvidersConfig, 
  saveProvidersConfig, 
  addProvider, 
  removeProvider, 
  formatProviderName, 
  getEnvStatus,
  providerToEnv,
  ProvidersConfig
} from '../src/utils/config';

describe('Configuration Management', () => {
  const tempDir = path.join(os.tmpdir(), 'ccx-config-test');
  const originalHome = os.homedir();
  let testConfigPath: string;

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
    testConfigPath = path.join(tempDir, 'providers.json');
    
    // Mock home directory for testing
    Object.defineProperty(process, 'env', {
      value: {
        ...process.env,
        HOME: tempDir
      }
    });
  });

  afterEach(async () => {
    // Restore original environment
    Object.defineProperty(process, 'env', {
      value: {
        ...process.env,
        HOME: originalHome
      }
    });
    
    await fs.remove(tempDir);
  });

  describe('Provider Configuration', () => {
    it('should create default configuration when none exists', async () => {
      const config = await loadProvidersConfig();
      
      expect(config).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(config.current).toBeDefined();
      expect(Object.keys(config.providers)).toContain('anthropic');
    });

    it('should save configuration correctly', async () => {
      const testConfig: ProvidersConfig = {
        current: 'test-provider',
        providers: {
          'test-provider': {
            name: 'Test Provider',
            api_key: 'test-key',
            base_url: 'https://test.com',
            model: 'test-model'
          }
        }
      };
      
      await saveProvidersConfig(testConfig);
      
      expect(await fs.pathExists(testConfigPath)).toBe(true);
      
      const savedConfig = JSON.parse(await fs.readFile(testConfigPath, 'utf8'));
      expect(savedConfig).toEqual(testConfig);
    });

    it('should load existing configuration', async () => {
      const existingConfig: ProvidersConfig = {
        current: 'existing-provider',
        providers: {
          'existing-provider': {
            name: 'Existing Provider',
            api_key: 'existing-key',
            base_url: 'https://existing.com',
            model: 'existing-model'
          }
        }
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(existingConfig, null, 2));
      
      const loadedConfig = await loadProvidersConfig();
      expect(loadedConfig).toEqual(existingConfig);
    });
  });

  describe('Provider Management', () => {
    it('should add new provider', async () => {
      const initialConfig: ProvidersConfig = {
        current: 'initial',
        providers: {
          'initial': {
            name: 'Initial Provider',
            api_key: 'initial-key',
            base_url: 'https://initial.com',
            model: 'initial-model'
          }
        }
      };
      
      await saveProvidersConfig(initialConfig);
      
      const newProvider = {
        name: 'New Provider',
        api_key: 'new-key',
        base_url: 'https://new.com',
        model: 'new-model'
      };
      
      await addProvider('new-provider', newProvider);
      
      const updatedConfig = await loadProvidersConfig();
      expect(updatedConfig.providers['new-provider']).toEqual(newProvider);
    });

    it('should remove provider', async () => {
      const configWithMultiple: ProvidersConfig = {
        current: 'provider1',
        providers: {
          'provider1': {
            name: 'Provider 1',
            api_key: 'key1',
            base_url: 'https://provider1.com',
            model: 'model1'
          },
          'provider2': {
            name: 'Provider 2',
            api_key: 'key2',
            base_url: 'https://provider2.com',
            model: 'model2'
          }
        }
      };
      
      await saveProvidersConfig(configWithMultiple);
      
      await removeProvider('provider2');
      
      const updatedConfig = await loadProvidersConfig();
      expect(updatedConfig.providers['provider2']).toBeUndefined();
      expect(updatedConfig.providers['provider1']).toBeDefined();
    });

    it('should handle removing current provider', async () => {
      const config: ProvidersConfig = {
        current: 'provider-to-remove',
        providers: {
          'provider-to-remove': {
            name: 'Provider to Remove',
            api_key: 'key',
            base_url: 'https://remove.com',
            model: 'model'
          },
          'other-provider': {
            name: 'Other Provider',
            api_key: 'other-key',
            base_url: 'https://other.com',
            model: 'other-model'
          }
        }
      };
      
      await saveProvidersConfig(config);
      
      await removeProvider('provider-to-remove');
      
      const updatedConfig = await loadProvidersConfig();
      expect(updatedConfig.current).toBe('other-provider');
    });
  });

  describe('Provider Formatting', () => {
    it('should format provider names correctly', () => {
      expect(formatProviderName('test_provider')).toBe('Test Provider');
      expect(formatProviderName('test-provider')).toBe('Test Provider');
      expect(formatProviderName('TestProvider')).toBe('Test Provider');
      expect(formatProviderName('TEST_PROVIDER')).toBe('Test Provider');
    });

    it('should handle special cases in provider names', () => {
      expect(formatProviderName('zhipu')).toBe('Zhipu');
      expect(formatProviderName('kimi')).toBe('Kimi');
      expect(formatProviderName('anyrouter')).toBe('Anyrouter');
    });
  });

  describe('Environment Status', () => {
    beforeEach(() => {
      // Set up test environment variables
      process.env.ANTHROPIC_AUTH_TOKEN = 'test-token';
      process.env.ANTHROPIC_BASE_URL = 'https://test.com';
      process.env.ANTHROPIC_MODEL = 'test-model';
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.ANTHROPIC_AUTH_TOKEN;
      delete process.env.ANTHROPIC_BASE_URL;
      delete process.env.ANTHROPIC_MODEL;
    });

    it('should get current environment status', async () => {
      const envStatus = await getEnvStatus();
      
      expect(envStatus.active).toEqual({
        ANTHROPIC_AUTH_TOKEN: 'test-token',
        ANTHROPIC_BASE_URL: 'https://test.com',
        ANTHROPIC_MODEL: 'test-model'
      });
    });

    it('should handle missing environment variables', async () => {
      delete process.env.ANTHROPIC_AUTH_TOKEN;
      delete process.env.ANTHROPIC_BASE_URL;
      delete process.env.ANTHROPIC_MODEL;
      
      const envStatus = await getEnvStatus();
      
      expect(envStatus.active).toEqual({});
    });
  });

  describe('Provider to Environment Conversion', () => {
    it('should convert provider configuration to environment variables', () => {
      const provider = {
        name: 'Test Provider',
        api_key: 'test-key',
        base_url: 'https://test.com',
        model: 'test-model'
      };
      
      const envVars = providerToEnv(provider);
      
      expect(envVars).toEqual({
        ANTHROPIC_AUTH_TOKEN: 'test-key',
        ANTHROPIC_BASE_URL: 'https://test.com',
        ANTHROPIC_MODEL: 'test-model'
      });
    });

    it('should handle provider without model', () => {
      const provider = {
        name: 'Test Provider',
        api_key: 'test-key',
        base_url: 'https://test.com'
      };
      
      const envVars = providerToEnv(provider);
      
      expect(envVars).toEqual({
        ANTHROPIC_AUTH_TOKEN: 'test-key',
        ANTHROPIC_BASE_URL: 'https://test.com'
      });
    });

    it('should handle provider with custom headers', () => {
      const provider = {
        name: 'Test Provider',
        api_key: 'test-key',
        base_url: 'https://test.com',
        model: 'test-model',
        headers: {
          'Custom-Header': 'custom-value'
        }
      };
      
      const envVars = providerToEnv(provider);
      
      expect(envVars).toEqual({
        ANTHROPIC_AUTH_TOKEN: 'test-key',
        ANTHROPIC_BASE_URL: 'https://test.com',
        ANTHROPIC_MODEL: 'test-model'
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should handle malformed configuration files', async () => {
      await fs.writeFile(testConfigPath, 'invalid json content');
      
      const config = await loadProvidersConfig();
      
      // Should return default configuration
      expect(config.providers).toBeDefined();
      expect(config.current).toBeDefined();
    });

    it('should handle empty configuration files', async () => {
      await fs.writeFile(testConfigPath, '{}');
      
      const config = await loadProvidersConfig();
      
      // Should populate with default values
      expect(config.providers).toBeDefined();
      expect(config.current).toBeDefined();
    });

    it('should handle configuration with missing required fields', async () => {
      const incompleteConfig = {
        current: 'test-provider',
        providers: {
          'test-provider': {
            name: 'Test Provider'
            // Missing required fields
          }
        }
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(incompleteConfig));
      
      const config = await loadProvidersConfig();
      
      // Should still load but may have incomplete data
      expect(config.providers['test-provider']).toBeDefined();
    });
  });

  describe('Configuration Migration', () => {
    it('should handle migration from old configuration format', async () => {
      const oldFormatConfig = {
        current: 'old-provider',
        providers: {
          'old-provider': {
            name: 'Old Provider',
            apiKey: 'old-key', // Old format
            baseUrl: 'https://old.com', // Old format
            model: 'old-model'
          }
        }
      };
      
      await fs.writeFile(testConfigPath, JSON.stringify(oldFormatConfig));
      
      const config = await loadProvidersConfig();
      
      // Should still load the configuration
      expect(config.providers['old-provider']).toBeDefined();
    });
  });
});