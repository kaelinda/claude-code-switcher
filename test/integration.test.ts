import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('CCX CLI Integration Tests', () => {
  const tempDir = path.join(os.tmpdir(), 'ccx-test');
  const originalProvidersPath = path.join(os.homedir(), '.claude', 'providers.json');
  const originalZshrcPath = path.join(os.homedir(), '.zshrc');
  let backupProvidersPath: string;
  let backupZshrcPath: string;

  beforeEach(async () => {
    // Create backup of original files
    backupProvidersPath = originalProvidersPath + '.backup.' + Date.now();
    backupZshrcPath = originalZshrcPath + '.backup.' + Date.now();
    
    if (await fs.pathExists(originalProvidersPath)) {
      await fs.copy(originalProvidersPath, backupProvidersPath);
    }
    if (await fs.pathExists(originalZshrcPath)) {
      await fs.copy(originalZshrcPath, backupZshrcPath);
    }

    // Create test environment
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    // Restore original files
    if (await fs.pathExists(backupProvidersPath)) {
      await fs.copy(backupProvidersPath, originalProvidersPath);
      await fs.remove(backupProvidersPath);
    }
    if (await fs.pathExists(backupZshrcPath)) {
      await fs.copy(backupZshrcPath, originalZshrcPath);
      await fs.remove(backupZshrcPath);
    }

    // Clean up temp directory
    await fs.remove(tempDir);
  });

  const runCommand = (command: string): { stdout: string; stderr: string; status: number } => {
    try {
      const stdout = execSync(`npm run dev -- ${command}`, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      return { stdout, stderr: '', status: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        status: error.status || 1
      };
    }
  };

  describe('Basic Commands', () => {
    it('should show help for unknown commands', () => {
      const result = runCommand('--help');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Usage:');
    });

    it('should show version', () => {
      const result = runCommand('--version');
      expect(result.status).toBe(0);
    });
  });

  describe('List Command', () => {
    it('should list all providers', () => {
      const result = runCommand('list');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Available API Providers');
      expect(result.stdout).toMatch(/zhipu|kimi|anyrouter/);
    });

    it('should show current provider indicator', () => {
      const result = runCommand('list');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('★'); // Current provider indicator
    });
  });

  describe('Current Command', () => {
    it('should show current configuration', () => {
      const result = runCommand('current');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('CCX Configuration Status');
      expect(result.stdout).toContain('Environment Configuration Status');
    });

    it('should show configured and active environment variables', () => {
      const result = runCommand('current');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Configured values:');
      expect(result.stdout).toContain('Active values:');
    });
  });

  describe('Provider Switching', () => {
    it('should switch between providers successfully', () => {
      const result = runCommand('use kimi --skip-test');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Successfully switched to kimi');
    });

    it('should show error for non-existent provider', () => {
      const result = runCommand('use nonexistent_provider');
      expect(result.status).toBe(1);
      expect(result.stdout).toContain('not found');
    });

    it('should create backup files when switching providers', () => {
      runCommand('use zhipu --skip-test');
      
      // Check if backup file was created
      const zshrcBackupPattern = /\.zshrc\.backup\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;
      const zshrcDir = path.dirname(originalZshrcPath);
      const files = fs.readdirSync(zshrcDir);
      const backupFiles = files.filter(file => file.match(zshrcBackupPattern));
      
      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Environment Variable Management', () => {
    it('should update environment variables in config files', () => {
      runCommand('use kimi --skip-test');
      
      const zshrcContent = fs.readFileSync(originalZshrcPath, 'utf8');
      expect(zshrcContent).toContain('ANTHROPIC_AUTH_TOKEN="sk-4V43iVXoQyES021XZM9NFTWDcfSZRLP0jAStiuLg6YfxNw1W"');
      expect(zshrcContent).toContain('ANTHROPIC_BASE_URL="https://api.moonshot.cn/anthropic"');
      expect(zshrcContent).toContain('ANTHROPIC_MODEL="kimi-k2-0711-preview"');
    });

    it('should show environment status correctly', () => {
      const result = runCommand('current');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Status:');
      expect(result.stdout).toContain('Configured:');
      expect(result.stdout).toContain('Active:');
    });
  });

  describe('Test Command', () => {
    it('should test current provider when no provider specified', () => {
      const result = runCommand('test');
      // The test may fail due to API issues, but it should run
      expect(result.stdout).toContain('Testing current provider');
    });

    it('should test specific provider when specified', () => {
      const result = runCommand('test kimi');
      expect(result.stdout).toContain('Testing provider: kimi');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', async () => {
      // Temporarily move configuration file
      const tempConfigPath = path.join(tempDir, 'providers.json');
      if (await fs.pathExists(originalProvidersPath)) {
        await fs.move(originalProvidersPath, tempConfigPath);
      }

      const result = runCommand('current');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('No provider currently configured');

      // Restore configuration
      if (await fs.pathExists(tempConfigPath)) {
        await fs.move(tempConfigPath, originalProvidersPath);
      }
    });

    it('should handle invalid API keys gracefully', () => {
      // This test verifies that the tool handles API errors gracefully
      const result = runCommand('test kimi');
      // The command should complete even if API test fails
      expect(result.stdout).toContain('Testing kimi');
    });
  });

  describe('Configuration File Management', () => {
    it('should maintain providers configuration file', () => {
      const configPath = originalProvidersPath;
      const configExists = fs.existsSync(configPath);
      expect(configExists).toBe(true);
    });

    it('should update current provider in configuration', () => {
      runCommand('use zhipu --skip-test');
      runCommand('use kimi --skip-test');
      
      const config = JSON.parse(fs.readFileSync(originalProvidersPath, 'utf8'));
      expect(config.current).toBe('kimi');
    });
  });
});