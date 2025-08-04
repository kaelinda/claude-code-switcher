import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { homedir } from 'os';
import { loadProvidersConfig, saveProvidersConfig } from '../utils/config';

interface MCPConfig {
  mcpServers: {
    [key: string]: {
      command: string;
      args?: string[];
      env?: { [key: string]: string };
      disabled?: boolean;
    };
  };
}

const SUPPORTED_TOOLS = [
  { name: 'Cursor', configPath: '.cursor/mcp.json' },
  { name: 'VS Code', configPath: '.vscode/mcp.json' },
  { name: 'Windsurf', configPath: '.windsurf/mcp.json' },
  { name: 'Cline', configPath: '.cline/mcp.json' },
  { name: 'Claude Desktop', configPath: 'Claude/claude_desktop_config.json' },
];

async function migrateMCPConfigurations() {
  console.log(chalk.cyan('\n🔄 MCP Configuration Migration Tool\n'));

  try {
    // Detect available MCP configurations
    const detectedConfigs = await detectMCPConfigs();
    
    if (detectedConfigs.length === 0) {
      console.log(chalk.yellow('No MCP configurations found in supported tools.'));
      console.log(chalk.gray('Searched locations:'));
      SUPPORTED_TOOLS.forEach(tool => {
        const fullPath = path.join(homedir(), tool.configPath);
        console.log(chalk.gray(`  - ${fullPath}`));
      });
      return;
    }

    // Let user choose which configurations to migrate
    const { selectedConfigs } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedConfigs',
        message: 'Select MCP configurations to migrate:',
        choices: detectedConfigs.map(config => ({
          name: `${config.tool} (${config.servers} servers)`,
          value: config,
          checked: true
        }))
      }
    ]);

    if (selectedConfigs.length === 0) {
      console.log(chalk.yellow('No configurations selected for migration.'));
      return;
    }

    // Load current Claude Code config
    const claudeConfig = await loadProvidersConfig();
    const currentMCPConfig = claudeConfig.mcp || {};

    console.log(chalk.blue('\n📋 Migration Summary:\n'));

    let totalServers = 0;
    for (const config of selectedConfigs) {
      const mcpConfig = await fs.readJson(config.path);
      const servers = Object.keys(mcpConfig.mcpServers || {});
      
      console.log(chalk.green(`  ${config.tool}:`));
      servers.forEach(server => {
        console.log(chalk.gray(`    - ${server}`));
        totalServers++;
      });

      // Merge MCP servers into Claude Code format
      for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers || {})) {
        const server = serverConfig as {
          command: string;
          args?: string[];
          env?: { [key: string]: string };
          disabled?: boolean;
        };
        
        // Generate unique name to avoid conflicts
        const uniqueName = `${config.tool.toLowerCase()}_${serverName}`;
        currentMCPConfig[uniqueName] = {
          command: server.command,
          args: server.args || [],
          env: server.env || {},
          disabled: server.disabled || false
        };
      }
    }

    // Show what will be migrated
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Migrate ${totalServers} MCP server(s) to Claude Code?`,
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Migration cancelled.'));
      return;
    }

    // Create backup
    const backupPath = path.join(homedir(), '.claude', `mcp_backup_${Date.now()}.json`);
    await fs.writeJson(backupPath, claudeConfig.mcp || {}, { spaces: 2 });
    console.log(chalk.blue(`\n💾 Backup created: ${backupPath}`));

    // Update Claude Code configuration
    claudeConfig.mcp = currentMCPConfig;
    await saveProvidersConfig(claudeConfig);

    console.log(chalk.green('\n✅ Migration completed successfully!'));
    console.log(chalk.gray(`\nMigrated ${totalServers} MCP server(s) to Claude Code.`));
    console.log(chalk.gray('You can now use these MCP servers in Claude Code.'));

    // Show migration details
    console.log(chalk.blue('\n📊 Migration Details:'));
    Object.keys(currentMCPConfig).forEach(serverName => {
      if (serverName.includes('_')) {
        const [sourceTool, originalName] = serverName.split('_', 2);
        console.log(chalk.gray(`  ${originalName} → ${serverName} (from ${sourceTool})`));
      }
    });

  } catch (error) {
    console.error(chalk.red('Migration failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function detectMCPConfigs(): Promise<Array<{
  tool: string;
  path: string;
  servers: number;
}>> {
  const detected: Array<{
    tool: string;
    path: string;
    servers: number;
  }> = [];

  for (const tool of SUPPORTED_TOOLS) {
    const configPath = path.join(homedir(), tool.configPath);
    
    if (await fs.pathExists(configPath)) {
      try {
        const config = await fs.readJson(configPath);
        const servers = Object.keys(config.mcpServers || {}).length;
        
        if (servers > 0) {
          detected.push({
            tool: tool.name,
            path: configPath,
            servers
          });
        }
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not read ${tool.name} config: ${error}`));
      }
    }
  }

  return detected;
}

// Export for programmatic usage
export { migrateMCPConfigurations as migrateCommand };