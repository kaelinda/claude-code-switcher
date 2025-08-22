import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { findExistingConfigFiles, getShellName, getCurrentShell } from '../utils/env';
import { colors, icons, format } from '../utils/style';

export async function syncUseCommand(): Promise<void> {
  console.log(colors.info(`${icons.rocket} Setting up ccuse shell alias...`));
  
  const configFiles = await findExistingConfigFiles();
  
  if (configFiles.length === 0) {
    const shell = getShellName(getCurrentShell());
    const defaultConfig = shell === 'zsh' ? '.zshrc' : '.bashrc';
    const configPath = path.join(os.homedir(), defaultConfig);
    configFiles.push(configPath);
    console.log(colors.warning(`No existing config files found, will create: ${defaultConfig}`));
  }

  // 创建独立的 shell 脚本
  const claudeDir = path.join(os.homedir(), '.claude');
  const scriptPath = path.join(claudeDir, 'ccuse.sh');
  
  await fs.ensureDir(claudeDir);
  
  const scriptContent = `#!/bin/bash
# cc-sw - Claude Code 快速切换脚本 (by cc-sw sync-use)

[[ -z "$1" ]] && { 
    echo "Usage: ccuse <provider> [options]"
    echo "Examples:"
    echo "  ccuse deepseek"
    echo "  ccuse zhipu --skip-test"
    echo "  ccuse anthropic"
    echo ""
    echo "Note: --skip-confirm enabled by default"
    exit 1
}

echo "🔄 Switching to $1..."
result=$(cc-sw use "$1" --skip-confirm "\${@:2}" --eval 2>/dev/null)

if [[ $? -eq 0 && "$result" =~ ^export ]]; then
    eval "$result" && echo "✅ Switched to $1 ($ANTHROPIC_MODEL)"
else
    echo "❌ Failed to switch to $1" && exit 1
fi
`;

  await fs.writeFile(scriptPath, scriptContent, 'utf8');
  await fs.chmod(scriptPath, 0o755);
  console.log(format.success(`${icons.check} Created script: ${scriptPath}`));

  // 创建别名而不是函数
  const shellAlias = `
# cc-sw - Claude Code 快速切换别名 (by cc-sw sync-use)
alias ccuse="bash ~/.claude/ccuse.sh"`;

  for (const configPath of configFiles) {
    try {
      const backupPath = `${configPath}.backup.${new Date().toISOString().replace(/[:.]/g, '-')}`;
      if (await fs.pathExists(configPath)) {
        await fs.copy(configPath, backupPath);
        console.log(format.success(`${icons.check} Created backup: ${backupPath}`));
      }

      let content = '';
      if (await fs.pathExists(configPath)) {
        content = await fs.readFile(configPath, 'utf8');
      }

      content = removeExistingCcUseFunction(content);
      const newContent = content + shellAlias + '\n';
      await fs.writeFile(configPath, newContent, 'utf8');
      console.log(format.success(`${icons.check} Added ccuse alias to: ${configPath}`));
      
    } catch (error) {
      console.log(format.error(`${icons.cross} Failed to update ${configPath}: ${error}`));
    }
  }

  console.log(format.section('\n🎉 Setup complete!'));
  console.log(colors.info('Now you can use:'));
  console.log(colors.secondary('  ccuse deepseek              # 立即切换到 DeepSeek'));
  console.log(colors.secondary('  ccuse zhipu                 # 立即切换到 智普清言'));
  console.log(colors.secondary('  ccuse kimi --skip-test      # 跳过连接测试'));
  console.log(colors.secondary('  ccuse ace                   # 立即切换到 AI-Code-Editor'));
  console.log(colors.info('\n💡 Features:'));
  console.log(colors.secondary('  • --skip-confirm is enabled by default'));
  console.log(colors.secondary('  • Shows success/failure status with logs'));
  console.log(colors.secondary('  • Uses external script (clean .zshrc)'));
  console.log(colors.secondary(`  • Script location: ${scriptPath}`));
  
  const shell = getShellName(getCurrentShell());
  const configFile = shell === 'zsh' ? '~/.zshrc' : '~/.bashrc';
  
  console.log(colors.info('\n🔄 To activate immediately, run:'));
  console.log(colors.warning(`  source ${configFile}`));
  console.log(colors.info('\nOr restart your terminal for automatic activation.'));
}

function removeExistingCcUseFunction(content: string): string {
  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let inCcUseBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.includes('cc-sw - Claude Code 快速切换') || trimmed.startsWith('alias ccuse=')) {
      inCcUseBlock = true;
      continue;
    }
    
    if (inCcUseBlock && trimmed === '}') {
      inCcUseBlock = false;
      continue;
    }
    
    if (inCcUseBlock && trimmed.startsWith('alias ccuse=')) {
      inCcUseBlock = false;
      continue;
    }
    
    if (inCcUseBlock) {
      continue;
    }
    
    filteredLines.push(line);
  }
  
  return filteredLines.join('\n');
}
