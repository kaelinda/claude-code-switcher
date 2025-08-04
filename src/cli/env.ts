import chalk from 'chalk';
import { getCurrentProviderEnv } from '../utils/config';
import { exportEnvVars, formatEnvVars } from '../utils/env';
import { Command } from 'commander';

export function envCommand(program: Command): void {
  program
    .command('env')
    .description('Manage environment variables')
    .option('--export', 'Export environment variables for shell eval')
    .option('--show', 'Show current environment variables')
    .action(async (options) => {
      try {
        const env = await getCurrentProviderEnv();
        
        if (options.export) {
          // Export format for shell eval
          const exportCommands = exportEnvVars(env);
          console.log(exportCommands);
        } else if (options.show) {
          // Show current environment variables
          console.log(formatEnvVars(env));
        } else {
          // Default behavior - show status
          console.log(chalk.cyan('Environment Variables Status:'));
          
          if (env.ANTHROPIC_AUTH_TOKEN) {
            console.log(chalk.green('✓ ANTHROPIC_AUTH_TOKEN: ***' + env.ANTHROPIC_AUTH_TOKEN.slice(-8)));
          } else {
            console.log(chalk.red('✗ ANTHROPIC_AUTH_TOKEN: Not set'));
          }
          
          if (env.ANTHROPIC_BASE_URL) {
            console.log(chalk.green('✓ ANTHROPIC_BASE_URL: ' + env.ANTHROPIC_BASE_URL));
          } else {
            console.log(chalk.red('✗ ANTHROPIC_BASE_URL: Not set'));
          }
          
          if (env.ANTHROPIC_MODEL) {
            console.log(chalk.green('✓ ANTHROPIC_MODEL: ' + env.ANTHROPIC_MODEL));
          } else {
            console.log(chalk.yellow('⚠ ANTHROPIC_MODEL: Not set (using default)'));
          }
          
          // Show usage examples
          console.log(chalk.cyan('\nUsage Examples:'));
          console.log(chalk.blue('  ccx env --show     # Show current environment variables'));
          console.log(chalk.blue('  ccx env --export   # Export for shell eval'));
          console.log(chalk.blue('  eval $(ccx env --export)  # Apply immediately'));
        }
      } catch (error) {
        console.error(chalk.red('Error managing environment variables:'), error);
        process.exit(1);
      }
    });
}