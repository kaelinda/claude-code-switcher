import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export async function installCommand(): Promise<void> {
  console.log(chalk.cyan('🔧 Installing cc-sw shell integration...'));
  console.log(chalk.gray('This will add convenient shell functions to your shell config file.\n'));

  // Get shell config file path
  const shell = process.env.SHELL || '/bin/zsh';
  const shellName = path.basename(shell);
  let configPath = '';

  switch (shellName) {
    case 'zsh':
      configPath = path.join(process.env.HOME || '', '.zshrc');
      break;
    case 'bash':
      configPath = path.join(process.env.HOME || '', '.bashrc');
      if (!fs.existsSync(configPath)) {
        configPath = path.join(process.env.HOME || '', '.bash_profile');
      }
      break;
    case 'fish':
      configPath = path.join(process.env.HOME || '', '.config/fish/config.fish');
      break;
    default:
      console.log(chalk.red(`❌ Unsupported shell: ${shellName}`));
      console.log(chalk.yellow('Please install manually by adding the following to your shell config:'));
      console.log(chalk.cyan('\n# cc-sw - Claude Code 快速切换函数'));
      console.log(chalk.cyan('ccuse() {'));
      console.log(chalk.cyan('    eval $(cc-sw use "$1" --eval 2>/dev/null)'));
      console.log(chalk.cyan('}'));
      return;
  }

  // Create backup
  const backupPath = `${configPath}.backup.${new Date().toISOString().replace(/[:.]/g, '-')}`;
  if (fs.existsSync(configPath)) {
    await fs.copy(configPath, backupPath);
    console.log(chalk.green(`✅ Created backup: ${backupPath}`));
  }

  // Read existing content
  let content = '';
  if (fs.existsSync(configPath)) {
    content = await fs.readFile(configPath, 'utf8');
  }

  // Remove existing cc-sw functions
  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let inCcswBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('# cc-sw - Claude Code 快速切换函数')) {
      inCcswBlock = true;
      continue;
    }
    
    if (inCcswBlock && trimmed.startsWith('cc-')) {
      continue;
    }
    
    if (inCcswBlock && trimmed === '}') {
      inCcswBlock = false;
      continue;
    }
    
    if (!inCcswBlock) {
      filteredLines.push(line);
    }
  }

  // Add new functions
  const functions = `
# cc-sw - Claude Code 快速切换函数
ccuse() {
    eval $(cc-sw use "$1" --eval 2>/dev/null)
}

# cc-sw - 列出所有可用 provider
cc-list() {
    cc-sw list
}

# cc-sw - 显示当前 provider
cc-current() {
    cc-sw current
}

# cc-sw - 测试连接
cc-test() {
    cc-sw test "$1"
}`;

  const newContent = filteredLines.join('\n') + functions;

  // Write back to config file
  await fs.writeFile(configPath, newContent, 'utf8');

  console.log(chalk.green(`✅ Shell functions added to: ${configPath}`));
  console.log(chalk.cyan('\n🎉 Now you can use:'));
  console.log(chalk.yellow('  ccuse <provider>     # 快速切换 provider (立即生效)'));
  console.log(chalk.yellow('  cc-list              # 列出所有可用 provider'));
  console.log(chalk.yellow('  cc-current           # 显示当前 provider'));
  console.log(chalk.yellow('  cc-test [provider]   # 测试连接'));
  console.log(chalk.cyan('\n🔄 Please restart your terminal or run:'));
  console.log(chalk.yellow(`  source ${configPath}`));
}