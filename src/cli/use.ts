import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadProvidersConfig, applyProviderEnv, formatProviderName, getEnvStatus, getCurrentProviderEnv } from '../utils/config';
import { testProviderConnection, formatTestResult } from '../utils/api';
import { reloadShell, showEnvStatus, exportEnvVars } from '../utils/env';
import { colors, icons, format } from '../utils/style';

export async function useCommand(providerName: string, options: { 
  skipTest?: boolean; 
  eval?: boolean;
  skipConfirm?: boolean;
  skipApplyConfirm?: boolean;
  skipTestConfirm?: boolean;
} = {}): Promise<void> {
  try {
    const config = await loadProvidersConfig();
    const normalizedProvider = providerName.toLowerCase();
    
    if (!config.providers[normalizedProvider]) {
      console.log(format.error(`Provider '${formatProviderName(normalizedProvider)}' not found.`));
      console.log(colors.info('Available providers:'));
      Object.keys(config.providers).forEach(name => {
        console.log(colors.secondary(`  - ${formatProviderName(name)}`));
      });
      console.log(colors.info('\nUse "ccx add <provider>" to add a new provider.\n'));
      return;
    }

    const provider = config.providers[normalizedProvider];
    
    // Validate provider configuration
    if (!provider.api_key || !provider.base_url || !provider.model) {
      console.log(format.error(`\n${icons.cross} Provider '${formatProviderName(normalizedProvider)}' has incomplete configuration.`));
      console.log(colors.warning('Required fields: api_key, base_url, model'));
      console.log(colors.info('\nUse "ccx add <provider>" to update the provider configuration.\n'));
      return;
    }
    
    // Test connection before switching (unless skipped)
    if (!options.skipTest) {
      console.log(colors.info(`${icons.rocket} Testing connection to ${formatProviderName(normalizedProvider)}...`));
      const testResult = await testProviderConnection(provider);
      
      if (!testResult.success) {
        console.log(format.warning(`\n${icons.warning} Connection test failed for ${formatProviderName(normalizedProvider)}.`));
        formatTestResult(testResult, normalizedProvider);
        
        // Ask if user wants to proceed anyway (unless skipped)
        if (!options.skipConfirm) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: 'Proceed anyway?',
              default: false,
              prefix: colors.warning.bold('?')
            }
          ]);
          
          if (!proceed) {
            console.log(format.info('Switch cancelled.\n'));
            return;
          }
        } else {
          console.log(colors.warning(`${icons.warning} Connection test failed, proceeding anyway due to --skip-confirm flag`));
        }
      } else {
        console.log(format.success(`\n${icons.check} Connection test passed for ${formatProviderName(normalizedProvider)}`));
      }
    }

    // Apply provider configuration to environment variables
    await applyProviderEnv(normalizedProvider);

    // If in eval mode, output export commands and exit
    if (options.eval) {
      const env = await getCurrentProviderEnv();
      console.log(exportEnvVars(env));
      return;
    }

    console.log(format.success(`\n${icons.check} Successfully switched to ${formatProviderName(normalizedProvider)}`));
    
    // Show current configuration with enhanced styling
    console.log(format.section('New Environment Configuration'));
    console.log(format.keyValue('Provider', formatProviderName(normalizedProvider), icons.star));
    console.log(format.keyValue('Model', provider.model, icons.rocket));
    console.log(format.keyValue('Base URL', provider.base_url, icons.link));
    console.log(format.keyValue('API Key', '***' + provider.api_key.slice(-8), icons.key));
    
    // Show that changes are immediately applied
    console.log('\n' + format.success('Environment variables have been automatically applied to your current session!'));
    console.log(colors.info('Configuration has also been saved to your shell config files for future sessions.'));
    
    // Show current active configuration
    const envStatus = await getEnvStatus();
    showEnvStatus(envStatus.config, envStatus.active);
    
      // Test the new configuration
    if (!options.skipTest) {
      console.log(colors.info('\nTesting new configuration...'));
      const testResult = await testProviderConnection(provider);
      if (testResult.success) {
        console.log(format.success('New configuration is working correctly!'));
      } else {
        console.log(format.error('New configuration test failed. Please check your setup.'));
        formatTestResult(testResult, normalizedProvider);
      }
    } else if (!options.skipConfirm) {
      console.log(colors.info('\nTo test the new configuration, run:'));
      console.log(colors.secondary('  ccx test'));
    }

  } catch (error) {
    console.error(format.error('Error switching provider:'), error);
    process.exit(1);
  }
}