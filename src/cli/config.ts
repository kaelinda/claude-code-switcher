import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PROVIDERS_CONFIG_FILE } from '../utils/config';

const execAsync = promisify(exec);

export async function configCommand(): Promise<void> {
  try {
    // Try to open with default editor
    const editor = process.env.EDITOR || 'nano';
    
    console.log(chalk.cyan(`Opening configuration file with ${editor}...`));
    
    await execAsync(`${editor} "${PROVIDERS_CONFIG_FILE}"`);
    
    console.log(chalk.green('\n✓ Configuration file updated.\n'));
    
  } catch (error) {
    // If editor fails, show file location
    console.log(chalk.yellow(`Could not open editor. Configuration file location:`));
    console.log(chalk.blue(PROVIDERS_CONFIG_FILE));
    console.log(chalk.cyan('\nYou can manually edit the file with your preferred editor.\n'));
  }
}