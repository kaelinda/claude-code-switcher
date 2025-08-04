import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadProvidersConfig, saveProvidersConfig, formatProviderName } from '../utils/config';
import { colors, icons, format } from '../utils/style';

export async function removeCommand(providerName: string): Promise<void> {
  try {
    const config = await loadProvidersConfig();
    const normalizedProvider = providerName.toLowerCase();
    
    if (!config.providers[normalizedProvider]) {
      console.log(format.error(`Provider '${formatProviderName(normalizedProvider)}' not found.`));
      console.log(colors.info('Available providers:'));
      Object.keys(config.providers).forEach(name => {
        console.log(colors.secondary(`  - ${formatProviderName(name)}`));
      });
      console.log();
      return;
    }

    const provider = config.providers[normalizedProvider];
    
    // Show provider details
    console.log(format.section('Provider to Remove'));
    console.log(format.keyValue('Name', provider.name, icons.dot));
    console.log(format.keyValue('Model', provider.model, icons.rocket));
    console.log(format.keyValue('Base URL', provider.base_url, icons.link));
    console.log(format.keyValue('API Key', provider.api_key.substring(0, 20) + '...', icons.key));
    console.log();

    // Confirm removal
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to remove ${formatProviderName(normalizedProvider)}?`,
        default: false,
        prefix: colors.warning.bold('?')
      }
    ]);

    if (!confirm) {
      console.log(format.info('Remove cancelled.\n'));
      return;
    }

    // Remove provider
    delete config.providers[normalizedProvider];
    
    // If this was the current provider, clear it or switch to another
    if (config.current === normalizedProvider) {
      const remainingProviders = Object.keys(config.providers);
      
      if (remainingProviders.length > 0) {
        // Ask if user wants to switch to another provider
        const { switchProvider } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'switchProvider',
            message: 'This was your current provider. Switch to another one?',
            default: true,
            prefix: colors.primary.bold('?')
          }
        ]);
        
        if (switchProvider) {
          const { newProvider } = await inquirer.prompt([
            {
              type: 'list',
              name: 'newProvider',
              message: 'Select new provider:',
              choices: remainingProviders.map(name => ({
                name: formatProviderName(name),
                value: name
              }))
            }
          ]);
          
          config.current = newProvider;
          console.log(colors.secondary(`${icons.check} Switched to ${formatProviderName(newProvider)}\n`));
        } else {
          config.current = '';
          console.log(colors.info('No current provider selected.\n'));
        }
      } else {
        config.current = '';
        console.log(colors.info('No providers remaining.\n'));
      }
    }
    
    await saveProvidersConfig(config);

    console.log(format.success(`Provider '${formatProviderName(normalizedProvider)}' removed successfully!\n`));

  } catch (error) {
    console.error(format.error('Error removing provider:'), error);
    process.exit(1);
  }
}