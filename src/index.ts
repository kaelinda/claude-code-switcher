#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { version } from '../package.json';

// Import commands
import { listCommand } from './cli/list';
import { currentCommand } from './cli/current';
import { useCommand } from './cli/use';
import { addCommand } from './cli/add';
import { removeCommand } from './cli/remove';
import { testCommand } from './cli/test';
import { configCommand } from './cli/config';
import { migrateCommand } from './cli/migrate';
import { envCommand } from './cli/env';

// Program setup
program
  .name('ccx')
  .description('Claude Code API provider and model switcher')
  .version(version);

// Commands
program
  .command('list')
  .alias('ls')
  .description('List all available API providers')
  .action(listCommand);

program
  .command('current')
  .alias('curr')
  .description('Show current API provider')
  .action(currentCommand);

program
  .command('use')
  .argument('<provider>', 'Provider name to switch to')
  .option('--skip-test', 'Skip connection test before switching')
  .option('--eval', 'Output environment variables for shell eval')
  .option('--skip-confirm', 'Skip all confirmation prompts')
  .option('--skip-apply-confirm', 'Skip environment variable application confirmation')
  .option('--skip-test-confirm', 'Skip final configuration test confirmation')
  .description('Switch to specified API provider and model')
  .action((provider, options) => useCommand(provider, options));

program
  .command('add')
  .argument('<provider>', 'Provider name to add')
  .description('Add new API provider configuration')
  .action(addCommand);

program
  .command('remove')
  .argument('<provider>', 'Provider name to remove')
  .description('Remove API provider configuration')
  .action(removeCommand);

program
  .command('test')
  .argument('[provider]', 'Provider name to test (optional, tests current if not specified)')
  .description('Test API provider connection')
  .action(testCommand);

program
  .command('config')
  .description('Open configuration file')
  .action(configCommand);

program
  .command('migrate')
  .description('Migrate MCP configurations from other tools (Cursor, VS Code, etc.)')
  .action(migrateCommand);

// Environment variables command
envCommand(program);

// Help command
program
  .command('help')
  .description('Display help information')
  .action(() => {
    console.log(chalk.cyan('\nCCX - Claude Code API Provider and Model Switcher\n'));
    console.log(chalk.yellow('Usage:'));
    console.log('  ccx <command> [options]\n');
    console.log(chalk.yellow('Commands:'));
    console.log('  list, ls              List all available API providers');
    console.log('  current, curr         Show current API provider');
    console.log('  use <provider>        Switch to specified API provider and model');
    console.log('  add <provider>        Add new API provider configuration');
    console.log('  remove <provider>     Remove API provider configuration');
    console.log('  test [provider]       Test API provider connection');
    console.log('  config                Open configuration file');
    console.log('  migrate               Migrate MCP configurations from other tools');
    console.log('  env                   Manage environment variables');
    console.log('  help                  Display help information');
    console.log('  --version             Show version information\n');
    console.log(chalk.yellow('Examples:'));
    console.log('  ccx list              # List all providers');
    console.log('  ccx use anthropic     # Switch to Anthropic provider and model');
    console.log('  ccx test openai       # Test OpenAI connection');
    console.log('  ccx config            # Open config file');
    console.log('  ccx env --show        # Show current environment variables');
    console.log('  eval $(ccx env --export)  # Apply environment variables immediately\n');
  });

// Parse arguments
program.parse();