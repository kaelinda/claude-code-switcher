import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadProvidersConfig, saveProvidersConfig, validateProviderConfig, formatProviderName } from '../utils/config';
import { testProviderConnection, formatTestResult } from '../utils/api';
import { colors, icons, format } from '../utils/style';

export async function addCommand(providerName: string): Promise<void> {
  try {
    const config = await loadProvidersConfig();
    const normalizedProvider = providerName.toLowerCase();
    
    if (config.providers[normalizedProvider]) {
      console.log(format.warning(`Provider '${formatProviderName(normalizedProvider)}' already exists.`));
      
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to overwrite it?',
          default: false,
          prefix: colors.primary.bold('?')
        }
      ]);
      
      if (!overwrite) {
        console.log(format.info('Add cancelled.\n'));
        return;
      }
    }

    // Ask for provider configuration with enhanced styling
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'displayName',
        message: 'Display name:',
        default: formatProviderName(normalizedProvider),
        validate: (input) => input.trim() !== '' || 'Display name is required',
        prefix: colors.primary.bold('?'),
        transformer: (input) => colors.accent(input)
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'API Key:',
        validate: (input) => input.trim() !== '' || 'API key is required',
        prefix: colors.primary.bold('?'),
        transformer: (input) => colors.lightGray(input.substring(0, 8) + '...')
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Base URL:',
        validate: (input) => input.trim() !== '' || 'Base URL is required',
        prefix: colors.primary.bold('?'),
        transformer: (input) => colors.secondary(input)
      },
      {
        type: 'input',
        name: 'model',
        message: 'Model:',
        validate: (input) => input.trim() !== '' || 'Model is required',
        prefix: colors.primary.bold('?'),
        transformer: (input) => colors.accent(input)
      },
      {
        type: 'input',
        name: 'headers',
        message: 'Custom headers (JSON format, optional):',
        prefix: colors.primary.bold('?'),
        transformer: (input) => colors.lightGray(input || 'none'),
        filter: (input) => {
          if (!input.trim()) return {};
          try {
            return JSON.parse(input);
          } catch {
            return {};
          }
        }
      }
    ]);

    // Create provider config
    const providerConfig = {
      name: answers.displayName,
      api_key: answers.apiKey,
      base_url: answers.baseUrl,
      model: answers.model,
      ...(answers.headers && Object.keys(answers.headers).length > 0 ? { headers: answers.headers } : {})
    };

    // Validate configuration
    if (!validateProviderConfig(providerConfig)) {
      console.log(format.error('Invalid provider configuration.'));
      process.exit(1);
    }

    // Test connection with enhanced styling
    console.log(colors.info(`\n${icons.rocket} Testing connection to ${answers.displayName}...`));
    const testResult = await testProviderConnection(providerConfig);
    formatTestResult(testResult, answers.displayName);

    if (!testResult.success) {
      const { saveAnyway } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'saveAnyway',
          message: 'Connection test failed. Save anyway?',
          default: false,
          prefix: colors.warning.bold('?')
        }
      ]);
      
      if (!saveAnyway) {
        console.log(format.info('Add cancelled.\n'));
        return;
      }
    }

    // Save configuration with success message
    config.providers[normalizedProvider] = providerConfig;
    
    // If this is the first provider, set it as current
    if (!config.current) {
      config.current = normalizedProvider;
      console.log(colors.secondary(`${icons.check} Set as current provider.\n`));
    }
    
    await saveProvidersConfig(config);

    console.log(format.success(`Provider '${formatProviderName(normalizedProvider)}' added successfully!`));

    // Ask if user wants to switch to this provider
    if (config.current !== normalizedProvider) {
      const { switchNow } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'switchNow',
          message: 'Switch to this provider now?',
          default: true,
          prefix: colors.primary.bold('?')
        }
      ]);
      
      if (switchNow) {
        config.current = normalizedProvider;
        await saveProvidersConfig(config);
        console.log(format.success(`Switched to ${formatProviderName(normalizedProvider)}`));
      }
    }
    
    console.log();

  } catch (error) {
    console.error(format.error('Error adding provider:'), error);
    process.exit(1);
  }
}