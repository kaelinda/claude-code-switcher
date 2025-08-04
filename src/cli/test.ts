import chalk from 'chalk';
import { testProviderConnection } from '../utils/api';
import { loadProvidersConfig, getCurrentProviderEnv } from '../utils/config';
import { colors, icons, format } from '../utils/style';

export async function testCommand(provider?: string) {
  try {
    const config = await loadProvidersConfig();
    const providers = config.providers;
    const currentProvider = config.current;
    
    if (!provider) {
      // Test current provider
      if (!currentProvider) {
        console.log(format.error('No current provider set'));
        console.log(colors.info('Use "ccx use <provider>" to set a provider first'));
        return;
      }
      provider = currentProvider;
    }
    
    if (!providers[provider]) {
      console.log(format.error(`Provider "${provider}" not found`));
      console.log(colors.info('Available providers:'));
      Object.keys(providers).forEach(p => {
        console.log(colors.secondary(`  - ${p}`));
      });
      return;
    }
    
    console.log(colors.info(`${icons.rocket} Testing connection to ${provider}...`));
    
    const providerConfig = providers[provider];
    const result = await testProviderConnection(providerConfig);
    
    if (result.success) {
      console.log(format.success('Connection successful!'));
      console.log(colors.gray(`Message: ${result.message}`));
      if (result.responseTime) {
        console.log(colors.gray(`Response time: ${result.responseTime}ms`));
      }
    } else {
      console.log(format.error('Connection failed'));
      console.log(colors.gray(`Error: ${result.error}`));
    }
  } catch (error) {
    console.log(format.error('Error testing connection:'));
    console.log(colors.gray(error instanceof Error ? error.message : String(error)));
  }
}