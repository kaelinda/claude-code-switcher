import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadProvidersConfig, formatProviderName } from '../utils/config';
import { colors, icons, format, typography } from '../utils/style';

export async function listCommand(): Promise<void> {
  try {
    const config = await loadProvidersConfig();
    
    if (Object.keys(config.providers).length === 0) {
      console.log(format.warning('No API providers configured.'));
      console.log(colors.info('Use "ccx add <provider>" to add a new provider.\n'));
      return;
    }

    console.log(format.section('Available API Providers'));
    
    const providers = Object.entries(config.providers);
    const currentProvider = config.current;
    
    // Display providers as cards
    providers.forEach(([name, provider]) => {
      const isCurrent = name === currentProvider;
      console.log('\n' + format.providerCard(provider, isCurrent));
    });

    // Summary with badges
    const total = providers.length;
    console.log('\n' + format.keyValue('Total providers', total.toString()));
    if (currentProvider) {
      console.log(format.keyValue('Current provider', formatProviderName(currentProvider)));
    }
    console.log();

  } catch (error) {
    console.error(format.error('Error listing providers:'), error);
    process.exit(1);
  }
}