import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { 
  getCurrentEnv, 
  getHomeDir, 
  getCurrentShell, 
  findShellConfigFiles, 
  findExistingConfigFiles,
  backupConfigFile,
  addEnvToConfigFile,
  setEnvironmentVariables,
  getConfigEnvVars,
  validateEnvVars,
  showEnvStatus,
  EnvironmentConfig
} from '../src/utils/env';

describe('Environment Variable Management', () => {
  const tempDir = path.join(os.tmpdir(), 'ccx-env-test');
  const originalHome = os.homedir();
  let testConfigPath: string;

  beforeEach(async () => {
    await fs.ensureDir(tempDir);
    testConfigPath = path.join(tempDir, '.zshrc');
    
    // Mock home directory for testing
    Object.defineProperty(process, 'env', {
      value: {
        ...process.env,
        HOME: tempDir,
        SHELL: '/bin/zsh'
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

  describe('Basic Environment Functions', () => {
    it('should get current environment variables', () => {
      process.env.ANTHROPIC_AUTH_TOKEN = 'test-token';
      process.env.ANTHROPIC_BASE_URL = 'https://test.com';
      
      const env = getCurrentEnv();
      
      expect(env.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      expect(env.ANTHROPIC_BASE_URL).toBe('https://test.com');
    });

    it('should get home directory', () => {
      const homeDir = getHomeDir();
      expect(homeDir).toBe(tempDir);
    });

    it('should get current shell', () => {
      const shell = getCurrentShell();
      expect(shell).toBe('/bin/zsh');
    });
  });

  describe('Shell Configuration File Management', () => {
    it('should find shell config files', () => {
      const configFiles = findShellConfigFiles('zsh');
      expect(configFiles).toContain(path.join(tempDir, '.zshrc'));
      expect(configFiles).toContain(path.join(tempDir, '.zshenv'));
    });

    it('should find existing config files', async () => {
      await fs.writeFile(testConfigPath, '# Test zshrc file');
      
      const existingFiles = await findExistingConfigFiles();
      expect(existingFiles).toContain(testConfigPath);
    });

    it('should create backup of config file', async () => {
      await fs.writeFile(testConfigPath, '# Original content');
      
      const backupPath = await backupConfigFile(testConfigPath);
      
      expect(backupPath).toBeTruthy();
      expect(await fs.pathExists(backupPath)).toBe(true);
      expect(await fs.readFile(backupPath, 'utf8')).toBe('# Original content');
    });
  });

  describe('Environment Variable Configuration', () => {
    it('should add environment variables to config file', async () => {
      const testEnv: EnvironmentConfig = {
        ANTHROPIC_AUTH_TOKEN: 'test-token',
        ANTHROPIC_BASE_URL: 'https://test.com',
        ANTHROPIC_MODEL: 'test-model'
      };

      await addEnvToConfigFile(testConfigPath, testEnv);
      
      const content = await fs.readFile(testConfigPath, 'utf8');
      expect(content).toContain('ANTHROPIC_AUTH_TOKEN="test-token"');
      expect(content).toContain('ANTHROPIC_BASE_URL="https://test.com"');
      expect(content).toContain('ANTHROPIC_MODEL="test-model"');
      expect(content).toContain('# CCX - Claude Code API Provider Configuration');
    });

    it('should replace existing environment variables', async () => {
      // First add some environment variables
      const initialEnv: EnvironmentConfig = {
        ANTHROPIC_AUTH_TOKEN: 'initial-token',
        ANTHROPIC_BASE_URL: 'https://initial.com'
      };
      
      await addEnvToConfigFile(testConfigPath, initialEnv);
      
      // Then replace with new ones
      const newEnv: EnvironmentConfig = {
        ANTHROPIC_AUTH_TOKEN: 'new-token',
        ANTHROPIC_BASE_URL: 'https://new.com',
        ANTHROPIC_MODEL: 'new-model'
      };
      
      await addEnvToConfigFile(testConfigPath, newEnv);
      
      const content = await fs.readFile(testConfigPath, 'utf8');
      expect(content).toContain('ANTHROPIC_AUTH_TOKEN="new-token"');
      expect(content).toContain('ANTHROPIC_BASE_URL="https://new.com"');
      expect(content).toContain('ANTHROPIC_MODEL="new-model"');
      
      // Should not contain old values
      expect(content).not.toContain('initial-token');
      expect(content).not.toContain('https://initial.com');
    });
  });

  describe('Environment Variable Validation', () => {
    it('should validate complete environment variables', () => {
      const validEnv = {
        ANTHROPIC_AUTH_TOKEN: 'test-token',
        ANTHROPIC_BASE_URL: 'https://test.com'
      };
      
      expect(validateEnvVars(validEnv)).toBe(true);
    });

    it('should reject incomplete environment variables', () => {
      const invalidEnv = {
        ANTHROPIC_AUTH_TOKEN: 'test-token'
        // Missing ANTHROPIC_BASE_URL
      };
      
      expect(validateEnvVars(invalidEnv)).toBe(false);
    });

    it('should reject empty environment variables', () => {
      const emptyEnv = {};
      expect(validateEnvVars(emptyEnv)).toBe(false);
    });
  });

  describe('Environment Variable Reading', () => {
    it('should read environment variables from config files', async () => {
      const configContent = `
# Some other configuration
export PATH=/usr/bin:$PATH

# CCX - Claude Code API Provider Configuration
export ANTHROPIC_AUTH_TOKEN="config-token"
export ANTHROPIC_BASE_URL="https://config.com"
export ANTHROPIC_MODEL="config-model"

# More configuration
export EDITOR=vim
`;
      
      await fs.writeFile(testConfigPath, configContent);
      
      const envVars = await getConfigEnvVars();
      
      expect(envVars.ANTHROPIC_AUTH_TOKEN).toBe('config-token');
      expect(envVars.ANTHROPIC_BASE_URL).toBe('https://config.com');
      expect(envVars.ANTHROPIC_MODEL).toBe('config-model');
    });

    it('should handle missing config files gracefully', async () => {
      const envVars = await getConfigEnvVars();
      expect(envVars).toEqual({});
    });
  });

  describe('Environment Variable Status Display', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should show environment status correctly', () => {
      const configEnv = {
        ANTHROPIC_AUTH_TOKEN: 'config-token',
        ANTHROPIC_BASE_URL: 'https://config.com'
      };
      
      const activeEnv = {
        ANTHROPIC_AUTH_TOKEN: 'active-token',
        ANTHROPIC_BASE_URL: 'https://active.com'
      };
      
      showEnvStatus(configEnv, activeEnv);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Environment Configuration Status'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Configured values'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Active values'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Status'));
    });

    it('should show different statuses for different configurations', () => {
      const configEnv = {
        ANTHROPIC_AUTH_TOKEN: 'config-token',
        ANTHROPIC_BASE_URL: 'https://config.com'
      };
      
      const activeEnv = {
        ANTHROPIC_AUTH_TOKEN: 'active-token',
        ANTHROPIC_BASE_URL: 'https://active.com'
      };
      
      showEnvStatus(configEnv, activeEnv);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Synced: ✗'));
    });

    it('should show synced status when configurations match', () => {
      const configEnv = {
        ANTHROPIC_AUTH_TOKEN: 'same-token',
        ANTHROPIC_BASE_URL: 'https://same.com'
      };
      
      const activeEnv = {
        ANTHROPIC_AUTH_TOKEN: 'same-token',
        ANTHROPIC_BASE_URL: 'https://same.com'
      };
      
      showEnvStatus(configEnv, activeEnv);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Synced: ✓'));
    });
  });

  describe('Set Environment Variables', () => {
    it('should create new config file if none exists', async () => {
      const testEnv: EnvironmentConfig = {
        ANTHROPIC_AUTH_TOKEN: 'test-token',
        ANTHROPIC_BASE_URL: 'https://test.com'
      };
      
      await setEnvironmentVariables(testEnv);
      
      const bashrcPath = path.join(tempDir, '.bashrc');
      expect(await fs.pathExists(bashrcPath)).toBe(true);
      
      const content = await fs.readFile(bashrcPath, 'utf8');
      expect(content).toContain('ANTHROPIC_AUTH_TOKEN="test-token"');
      expect(content).toContain('ANTHROPIC_BASE_URL="https://test.com"');
    });

    it('should update existing config files', async () => {
      // Create existing config file
      await fs.writeFile(testConfigPath, '# Existing configuration');
      
      const testEnv: EnvironmentConfig = {
        ANTHROPIC_AUTH_TOKEN: 'test-token',
        ANTHROPIC_BASE_URL: 'https://test.com'
      };
      
      await setEnvironmentVariables(testEnv);
      
      const content = await fs.readFile(testConfigPath, 'utf8');
      expect(content).toContain('# Existing configuration');
      expect(content).toContain('ANTHROPIC_AUTH_TOKEN="test-token"');
      expect(content).toContain('ANTHROPIC_BASE_URL="https://test.com"');
    });
  });
});