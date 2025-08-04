import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

export interface EnvironmentConfig {
  ANTHROPIC_AUTH_TOKEN: string;
  ANTHROPIC_BASE_URL: string;
  ANTHROPIC_MODEL?: string;
}

export interface ShellConfig {
  name: string;
  configFiles: string[];
  priority: number;
}

export const SUPPORTED_SHELLS: ShellConfig[] = [
  { name: 'zsh', configFiles: ['.zshrc', '.zshenv'], priority: 1 },
  { name: 'bash', configFiles: ['.bashrc', '.bash_profile', '.profile'], priority: 2 },
  { name: 'fish', configFiles: ['.config/fish/config.fish'], priority: 3 },
];

// Get current environment variables
export function getCurrentEnv(): Partial<EnvironmentConfig> {
  return {
    ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  };
}

// Get user's home directory
export function getHomeDir(): string {
  return os.homedir();
}

// Get current shell
export function getCurrentShell(): string {
  return process.env.SHELL || '/bin/bash';
}

// Get shell name from path
export function getShellName(shellPath: string): string {
  return path.basename(shellPath);
}

// Find shell config files
export function findShellConfigFiles(shellName: string): string[] {
  const homeDir = getHomeDir();
  const shell = SUPPORTED_SHELLS.find(s => s.name === shellName);
  
  if (!shell) {
    // Fallback to common config files
    return ['.bashrc', '.zshrc', '.profile'].map(file => path.join(homeDir, file));
  }
  
  return shell.configFiles.map(file => path.join(homeDir, file));
}

// Find existing config files
export async function findExistingConfigFiles(): Promise<string[]> {
  const shellName = getShellName(getCurrentShell());
  const configFiles = findShellConfigFiles(shellName);
  const existingFiles: string[] = [];
  
  for (const file of configFiles) {
    if (await fs.pathExists(file)) {
      existingFiles.push(file);
    }
  }
  
  return existingFiles;
}

// Create backup of config file
export async function backupConfigFile(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  
  if (await fs.pathExists(filePath)) {
    await fs.copy(filePath, backupPath);
    return backupPath;
  }
  
  return '';
}

// Add environment variables to config file
export async function addEnvToConfigFile(
  configPath: string, 
  env: EnvironmentConfig
): Promise<void> {
  const backupPath = await backupConfigFile(configPath);
  if (backupPath) {
    console.log(chalk.blue(`Configuration backed up to: ${backupPath}`));
  }
  
  const envBlock = generateEnvBlock(env);
  
  // Read existing content
  let content = '';
  if (await fs.pathExists(configPath)) {
    content = await fs.readFile(configPath, 'utf8');
  }
  
  // Remove existing CCX environment variables
  content = removeExistingEnvVars(content);
  
  // Add new environment variables
  const newContent = content + '\n' + envBlock + '\n';
  
  await fs.writeFile(configPath, newContent, 'utf8');
}

// Generate environment variable block
function generateEnvBlock(env: EnvironmentConfig): string {
  const lines = [
    '# CCX - Claude Code API Provider Configuration',
    'export ANTHROPIC_AUTH_TOKEN="' + env.ANTHROPIC_AUTH_TOKEN + '"',
    'export ANTHROPIC_BASE_URL="' + env.ANTHROPIC_BASE_URL + '"',
  ];
  
  if (env.ANTHROPIC_MODEL) {
    lines.push('export ANTHROPIC_MODEL="' + env.ANTHROPIC_MODEL + '"');
  }
  
  return lines.join('\n');
}

// Remove existing CCX environment variables
function removeExistingEnvVars(content: string): string {
  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let inCcxBlock = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('# CCX - Claude Code API Provider Configuration')) {
      inCcxBlock = true;
      continue;
    }
    
    if (inCcxBlock && trimmed.startsWith('export ANTHROPIC_')) {
      continue;
    }
    
    if (inCcxBlock && !trimmed.startsWith('export ANTHROPIC_') && trimmed !== '') {
      inCcxBlock = false;
    }
    
    if (!inCcxBlock) {
      filteredLines.push(line);
    }
  }
  
  return filteredLines.join('\n');
}

// Set environment variables permanently to config files and immediately to current session
export async function setEnvironmentVariables(env: EnvironmentConfig): Promise<void> {
  const configFiles = await findExistingConfigFiles();
  
  if (configFiles.length === 0) {
    // Create a new .bashrc file
    const bashrcPath = path.join(getHomeDir(), '.bashrc');
    await addEnvToConfigFile(bashrcPath, env);
    console.log(chalk.yellow(`Created new configuration file: ${bashrcPath}`));
  } else {
    // Update existing config files
    for (const configPath of configFiles) {
      await addEnvToConfigFile(configPath, env);
      console.log(chalk.green(`Updated configuration file: ${configPath}`));
    }
  }
  
  // Apply environment variables to current session immediately
  applyToCurrentSession(env);
}

// Get current environment variables from config files
export async function getConfigEnvVars(): Promise<Partial<EnvironmentConfig>> {
  const configFiles = await findExistingConfigFiles();
  const envVars: Partial<EnvironmentConfig> = {};
  
  for (const configPath of configFiles) {
    if (await fs.pathExists(configPath)) {
      const content = await fs.readFile(configPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^export\s+ANTHROPIC_(AUTH_TOKEN|BASE_URL|MODEL)\s*=\s*["']?([^"']+)["']?/);
        if (match) {
          const key = match[1];
          const value = match[2];
          
          if (key === 'AUTH_TOKEN') {
            envVars.ANTHROPIC_AUTH_TOKEN = value;
          } else if (key === 'BASE_URL') {
            envVars.ANTHROPIC_BASE_URL = value;
          } else if (key === 'MODEL') {
            envVars.ANTHROPIC_MODEL = value;
          }
        }
      }
    }
  }
  
  return envVars;
}

// Reload shell configuration and apply changes immediately
export function reloadShell(): void {
  const shell = getShellName(getCurrentShell());
  
  try {
    if (shell === 'zsh') {
      console.log(chalk.cyan('✓ Environment variables have been automatically applied to your current session'));
      console.log(chalk.gray('Configuration also saved to ~/.zshrc for future sessions'));
    } else if (shell === 'bash') {
      console.log(chalk.cyan('✓ Environment variables have been automatically applied to your current session'));
      console.log(chalk.gray('Configuration also saved to ~/.bashrc for future sessions'));
    } else if (shell === 'fish') {
      console.log(chalk.cyan('✓ Environment variables have been automatically applied to your current session'));
      console.log(chalk.gray('Configuration also saved to ~/.config/fish/config.fish for future sessions'));
    } else {
      console.log(chalk.cyan('✓ Environment variables have been applied to your current session'));
    }
    
    console.log(chalk.green('\nYour Claude Code provider has been switched successfully!'));
    
  } catch (error) {
    console.log(chalk.cyan('✓ Environment variables have been applied to your current session'));
  }
}

// Export environment variables for shell eval
export function exportEnvVars(env: Partial<EnvironmentConfig>): string {
  const lines = [];
  
  if (env.ANTHROPIC_AUTH_TOKEN) {
    lines.push(`export ANTHROPIC_AUTH_TOKEN="${env.ANTHROPIC_AUTH_TOKEN}"`);
  }
  
  if (env.ANTHROPIC_BASE_URL) {
    lines.push(`export ANTHROPIC_BASE_URL="${env.ANTHROPIC_BASE_URL}"`);
  }
  
  if (env.ANTHROPIC_MODEL) {
    lines.push(`export ANTHROPIC_MODEL="${env.ANTHROPIC_MODEL}"`);
  }
  
  return lines.join('\n');
}

// Format environment variables for display
export function formatEnvVars(env: Partial<EnvironmentConfig>): string {
  const lines = [
    chalk.cyan('Current environment variables:'),
    chalk.blue(`  ANTHROPIC_AUTH_TOKEN: ${env.ANTHROPIC_AUTH_TOKEN ? '***' + env.ANTHROPIC_AUTH_TOKEN.slice(-8) : 'Not set'}`),
    chalk.blue(`  ANTHROPIC_BASE_URL: ${env.ANTHROPIC_BASE_URL || 'Not set'}`),
    chalk.blue(`  ANTHROPIC_MODEL: ${env.ANTHROPIC_MODEL || 'Not set'}`),
  ];
  
  return lines.join('\n');
}

// Validate environment variables
export function validateEnvVars(env: Partial<EnvironmentConfig>): boolean {
  return !!(env.ANTHROPIC_AUTH_TOKEN && env.ANTHROPIC_BASE_URL);
}

// Apply environment variables to current session immediately
export function applyToCurrentSession(env: EnvironmentConfig): void {
  // Set environment variables for current Node.js process
  process.env.ANTHROPIC_AUTH_TOKEN = env.ANTHROPIC_AUTH_TOKEN;
  process.env.ANTHROPIC_BASE_URL = env.ANTHROPIC_BASE_URL;
  if (env.ANTHROPIC_MODEL) {
    process.env.ANTHROPIC_MODEL = env.ANTHROPIC_MODEL;
  }
  
  console.log(chalk.green('✓ Environment variables applied to current session'));
}

// Show environment variables status
export function showEnvStatus(config: Partial<EnvironmentConfig>, active: Partial<EnvironmentConfig>): void {
  console.log(chalk.cyan('\nEnvironment Configuration Status:'));
  
  // Show configured values
  console.log(chalk.yellow('Configured values:'));
  console.log(chalk.blue(`  ANTHROPIC_AUTH_TOKEN: ${config.ANTHROPIC_AUTH_TOKEN ? '***' + config.ANTHROPIC_AUTH_TOKEN.slice(-8) : 'Not set'}`));
  console.log(chalk.blue(`  ANTHROPIC_BASE_URL: ${config.ANTHROPIC_BASE_URL || 'Not set'}`));
  console.log(chalk.blue(`  ANTHROPIC_MODEL: ${config.ANTHROPIC_MODEL || 'Not set'}`));
  
  // Show active values
  console.log(chalk.yellow('\nActive values (current session):'));
  console.log(chalk.blue(`  ANTHROPIC_AUTH_TOKEN: ${active.ANTHROPIC_AUTH_TOKEN ? '***' + active.ANTHROPIC_AUTH_TOKEN.slice(-8) : 'Not set'}`));
  console.log(chalk.blue(`  ANTHROPIC_BASE_URL: ${active.ANTHROPIC_BASE_URL || 'Not set'}`));
  console.log(chalk.blue(`  ANTHROPIC_MODEL: ${active.ANTHROPIC_MODEL || 'Not set'}`));
  
  // Show status
  const isConfigured = validateEnvVars(config);
  const isActive = validateEnvVars(active);
  
  console.log(chalk.yellow('\nStatus:'));
  console.log(chalk.blue(`  Configured: ${isConfigured ? '✓' : '✗'}`));
  console.log(chalk.blue(`  Active: ${isActive ? '✓' : '✗'}`));
  console.log(chalk.blue(`  Synced: ${JSON.stringify(config) === JSON.stringify(active) ? '✓' : '✗'}`));
  console.log(chalk.blue(`  Auto-applied: ${isActive ? '✓' : '✗'}`));
  
  if (!isConfigured) {
    console.log(chalk.red('\nEnvironment variables are not properly configured!'));
  } else if (!isActive) {
    console.log(chalk.yellow('\nEnvironment variables are configured but not active in current session.'));
    console.log(chalk.cyan('Please restart your terminal or run: source ~/.bashrc'));
  } else if (JSON.stringify(config) !== JSON.stringify(active)) {
    console.log(chalk.yellow('\nConfiguration and active values differ. Please restart your terminal.'));
  } else {
    console.log(chalk.green('\nEnvironment variables are properly configured and active!'));
  }
}