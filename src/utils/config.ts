import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { EnvironmentConfig, getCurrentEnv, setEnvironmentVariables, getConfigEnvVars } from './env';

export const CONFIG_DIR = path.join(os.homedir(), '.claude');
export const PROVIDERS_CONFIG_FILE = path.join(CONFIG_DIR, 'providers.json');

export interface ProviderConfig {
  name: string;
  api_key: string;
  base_url: string;
  model: string;
  headers?: Record<string, string>;
}

export interface ProvidersConfig {
  current: string;
  providers: Record<string, ProviderConfig>;
  mcp?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    disabled?: boolean;
  }>;
}

export const defaultConfig: ProvidersConfig = {
  current: '',
  providers: {},
  mcp: {}
};

export async function loadProvidersConfig(): Promise<ProvidersConfig> {
  try {
    if (await fs.pathExists(PROVIDERS_CONFIG_FILE)) {
      const config = await fs.readJSON(PROVIDERS_CONFIG_FILE);
      return { ...defaultConfig, ...config };
    }
    return defaultConfig;
  } catch (error) {
    console.error(chalk.red('Error loading providers config:'), error);
    return defaultConfig;
  }
}

export async function saveProvidersConfig(config: ProvidersConfig): Promise<void> {
  try {
    await fs.ensureDir(CONFIG_DIR);
    await fs.writeJSON(PROVIDERS_CONFIG_FILE, config, { spaces: 2 });
  } catch (error) {
    console.error(chalk.red('Error saving providers config:'), error);
    throw error;
  }
}

export async function loadClaudeConfig(): Promise<any> {
  // Deprecated: Return environment variables instead
  return getCurrentEnv();
}

export async function saveClaudeConfig(config: any): Promise<void> {
  // Deprecated: Set environment variables instead
  console.log(chalk.yellow('Warning: saveClaudeConfig is deprecated. Environment variables are used instead.'));
}

export function validateProviderConfig(config: ProviderConfig): boolean {
  return !!(config.name && config.api_key && config.base_url && config.model);
}

export function formatProviderName(name: string): string {
  return name;
}

export async function backupConfig(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(CONFIG_DIR, `providers.json.backup.${timestamp}`);
  
  try {
    if (await fs.pathExists(PROVIDERS_CONFIG_FILE)) {
      await fs.copy(PROVIDERS_CONFIG_FILE, backupFile);
      return backupFile;
    }
    return '';
  } catch (error) {
    console.error(chalk.red('Error creating backup:'), error);
    return '';
  }
}

// Convert provider config to environment config
export function providerToEnvConfig(provider: ProviderConfig): EnvironmentConfig {
  return {
    ANTHROPIC_AUTH_TOKEN: provider.api_key,
    ANTHROPIC_BASE_URL: provider.base_url,
    ANTHROPIC_MODEL: provider.model,
  };
}

// Get current environment configuration from providers
export async function getCurrentProviderEnv(): Promise<Partial<EnvironmentConfig>> {
  const config = await loadProvidersConfig();
  
  if (!config.current || !config.providers[config.current]) {
    return {};
  }
  
  const provider = config.providers[config.current];
  return providerToEnvConfig(provider);
}

// Apply provider configuration to environment variables
export async function applyProviderEnv(providerName: string): Promise<void> {
  const config = await loadProvidersConfig();
  const normalizedProvider = providerName.toLowerCase();
  
  if (!config.providers[normalizedProvider]) {
    throw new Error(`Provider '${normalizedProvider}' not found`);
  }
  
  const provider = config.providers[normalizedProvider];
  const envConfig = providerToEnvConfig(provider);
  
  await setEnvironmentVariables(envConfig);
  
  // Update current provider in config
  config.current = normalizedProvider;
  await saveProvidersConfig(config);
}

// Get environment status information
export async function getEnvStatus(): Promise<{
  config: Partial<EnvironmentConfig>;
  active: Partial<EnvironmentConfig>;
  provider: string | null;
}> {
  const config = await getCurrentProviderEnv();
  const active = getCurrentEnv();
  const providersConfig = await loadProvidersConfig();
  
  return {
    config,
    active,
    provider: providersConfig.current || null,
  };
}