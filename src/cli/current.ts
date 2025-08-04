import chalk from 'chalk';
import { loadProvidersConfig, formatProviderName, getEnvStatus } from '../utils/config';
import { showEnvStatus } from '../utils/env';
import { colors, icons, format } from '../utils/style';

export async function currentCommand(): Promise<void> {
  try {
    const config = await loadProvidersConfig();
    const envStatus = await getEnvStatus();
    
    console.log(format.section('CCX Configuration Status'));
    
    // Show configured provider with enhanced styling
    if (config.current) {
      const currentProvider = config.providers[config.current];
      
      if (currentProvider) {
        console.log(colors.success.bold(`${icons.star} Current Provider:`));
        console.log(format.keyValue('Name', formatProviderName(config.current), icons.dot));
        console.log(format.keyValue('Model', currentProvider.model, icons.rocket));
        console.log(format.keyValue('Base URL', currentProvider.base_url, icons.link));
        console.log(format.keyValue('API Key', '***' + currentProvider.api_key.slice(-8), icons.key));
        
        if (currentProvider.headers) {
          console.log(format.keyValue('Custom Headers', Object.keys(currentProvider.headers).join(', '), icons.settings));
        }
        console.log();
      } else {
        console.log(format.error(`Configured provider '${config.current}' not found in configuration.`));
        console.log(colors.info('Use "ccx use <provider>" to select a valid provider.\n'));
      }
    } else {
      console.log(format.warning('No provider currently configured.'));
      console.log(colors.info('Use "ccx use <provider>" to select a provider.\n'));
    }
    
    // Show environment variable status
    showEnvStatus(envStatus.config, envStatus.active);
    
    // Show available providers with badges
    console.log(format.section('Available Providers'));
    Object.keys(config.providers).forEach(name => {
      const provider = config.providers[name];
      const isCurrent = name === config.current;
      const status = isCurrent ? format.badge('ACTIVE', 'success') : '';
      console.log(`  ${colors.primary('○')} ${colors.secondary.bold(formatProviderName(name))} ${status}`);
    });
    
    console.log();

  } catch (error) {
    console.error(format.error('Error getting current provider:'), error);
    process.exit(1);
  }
}