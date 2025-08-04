# CCX - Claude Code API Provider and Model Switcher

A powerful command-line tool for switching between different API providers and their corresponding models in Claude Code.

## Features

- 🔄 **Quick Switching**: Seamlessly switch between different API providers and their models
- 🔒 **Secure Management**: Safely manage multiple API keys and configurations
- 🧪 **Connection Testing**: Test API connections before switching
- 📊 **Status Display**: View current provider and all available providers
- 🎨 **User-Friendly**: Intuitive CLI with colored output and interactive prompts
- 📦 **Cross-Platform**: Works on macOS, Linux, and Windows
- 🤖 **Model Management**: Automatically switches models when changing providers

## Installation

### From Source

```bash
# Clone the repository
git clone <repository-url>
cd ccx

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

### Using Package Manager (when published)

```bash
npm install -g ccx
```

## Quick Start

1. **Add your first provider:**
   ```bash
   ccx add anthropic
   ```

2. **List available providers:**
   ```bash
   ccx list
   ```

3. **Switch to a provider:**
   ```bash
   ccx use anthropic
   ```

4. **Test your connection:**
   ```bash
   ccx test
   ```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `ccx list` | `ls` | List all available API providers |
| `ccx current` | `curr` | Show current API provider and model |
| `ccx use <provider>` | | Switch to specified API provider and model |
| `ccx add <provider>` | | Add new API provider configuration |
| `ccx remove <provider>` | | Remove API provider configuration |
| `ccx test [provider]` | | Test API provider connection |
| `ccx config` | | Open configuration file |
| `ccx migrate` | | Migrate MCP configurations from other tools |
| `ccx help` | | Display help information |
| `ccx --version` | | Show version information |

## Supported Providers

### Anthropic
```bash
ccx add anthropic
```
Configuration:
- API Key: Your Anthropic API key
- Base URL: `https://api.anthropic.com`
- Model: `claude-3-5-sonnet-20241022`

### OpenAI
```bash
ccx add openai
```
Configuration:
- API Key: Your OpenAI API key
- Base URL: `https://api.openai.com/v1`
- Model: `gpt-4`

### Kimi (月之暗面)
```bash
ccx add kimi
```
Configuration:
- API Key: Your Kimi API key
- Base URL: `https://api.moonshot.cn/v1`
- Model: `moonshot-v1-8k` 或 `moonshot-v1-32k` 或 `moonshot-v1-128k`

### Custom Providers
You can add any custom API provider that follows the OpenAI-compatible format:

```bash
ccx add my-provider
```

## Configuration

### Configuration File

The configuration is stored in `~/.claude/providers.json`:

```json
{
  "current": "anthropic",
  "providers": {
    "anthropic": {
      "name": "Anthropic",
      "api_key": "sk-ant-api03-...",
      "base_url": "https://api.anthropic.com",
      "model": "claude-3-5-sonnet-20241022"
    },
    "openai": {
      "name": "OpenAI",
      "api_key": "sk-...",
      "base_url": "https://api.openai.com/v1",
      "model": "gpt-4"
    }
  }
}
```

### Environment Variables

You can set the following environment variables:

- `EDITOR`: Default editor for config command (default: nano)
- `CCX_CONFIG_DIR`: Custom configuration directory

## 详细使用指南

### ccx use 命令详细说明

`ccx use` 是核心命令，用于切换 API 提供商和对应的模型。当您切换到某个提供商时，ccx 会自动：

1. 更新 Claude Code 的配置文件 (`~/.claude/settings.json`)
2. 切换 API 密钥
3. 切换基础 URL
4. **切换到该提供商配置的模型**

#### 以 Kimi 为例的完整使用流程

**1. 添加 Kimi 提供商**

```bash
ccx add kimi
```

系统会提示您输入以下信息：
```
? Display name: Kimi
? API Key: sk-您的Kimi API密钥
? Base URL: https://api.moonshot.cn/v1
? Model: moonshot-v1-32k
? Custom headers (JSON format, optional): [直接回车跳过]
```

**2. 测试 Kimi 连接**

```bash
ccx test kimi
```

**3. 切换到 Kimi**

```bash
ccx use kimi
```

执行此命令后，ccx 会：
- ✅ 测试 Kimi 的 API 连接
- ✅ 备份当前配置
- ✅ 更新提供商配置为 Kimi
- ✅ 更新 Claude Code 配置文件：
  - `model`: `moonshot-v1-32k`
  - `api_key`: 您的 Kimi API 密钥
  - `base_url`: `https://api.moonshot.cn/v1`

**4. 验证切换结果**

```bash
ccx current
```

输出示例：
```
Current API Provider:

Name: Kimi
Model: moonshot-v1-32k
Base URL: https://api.moonshot.cn/v1
API Key: sk-xxxxxxxx...
```

### 多模型管理示例

**添加不同模型的 Kimi 配置：**

```bash
# 添加 8K 版本
ccx add kimi-8k
# Display name: Kimi 8K
# API Key: sk-您的Kimi API密钥
# Base URL: https://api.moonshot.cn/v1
# Model: moonshot-v1-8k

# 添加 128K 版本
ccx add kimi-128k
# Display name: Kimi 128K
# API Key: sk-您的Kimi API密钥
# Base URL: https://api.moonshot.cn/v1
# Model: moonshot-v1-128k
```

**在不同模型间切换：**

```bash
# 切换到 8K 模型
ccx use kimi-8k

# 切换到 128K 模型
ccx use kimi-128k
```

### 实际工作流程示例

```bash
# 1. 查看所有可用的提供商
ccx list

# 2. 查看当前使用的提供商和模型
ccx current

# 3. 切换到 Kimi 进行长文本处理
ccx use kimi-128k

# 4. 验证连接
ccx test

# 5. 切换回 Anthropic 进行代码任务
ccx use anthropic

# 6. 再次验证
ccx current
```

## MCP Migration

The `ccx migrate` command allows you to easily migrate MCP (Model Context Protocol) configurations from other tools like Cursor, VS Code, Windsurf, Cline, and Claude Desktop to Claude Code.

### Supported Tools

- **Cursor** - Migrates from `~/.cursor/mcp.json`
- **VS Code** - Migrates from `~/.vscode/mcp.json`
- **Windsurf** - Migrates from `~/.windsurf/mcp.json`
- **Cline** - Migrates from `~/.cline/mcp.json`
- **Claude Desktop** - Migrates from `~/Claude/claude_desktop_config.json`

### Usage

```bash
# Run the migration tool
ccx migrate

# Interactive migration process:
# 1. Detects existing MCP configurations
# 2. Shows available configurations to migrate
# 3. Creates automatic backup
# 4. Migrates selected configurations
```

### Migration Process

1. **Detection**: Automatically scans for MCP configs in supported tools
2. **Selection**: Interactive selection of configurations to migrate
3. **Backup**: Creates timestamped backup of existing Claude Code MCP config
4. **Migration**: Safely migrates MCP servers with unique naming to avoid conflicts
5. **Reporting**: Shows detailed migration summary

### Example Migration

```bash
$ ccx migrate

🔄 MCP Configuration Migration Tool

? Select MCP configurations to migrate: (Press <space> to select, <a> to toggle all, <i> to invert selection)
 ❯◉ Cursor (3 servers)
   ◉ VS Code (2 servers)
   ◯ Claude Desktop (1 server)

📋 Migration Summary:

  Cursor:
    - github-mcp-server
    - filesystem-mcp-server
    - web-search-mcp-server

  VS Code:
    - postgres-mcp-server
    - redis-mcp-server

? Migrate 5 MCP server(s) to Claude Code? Yes

💾 Backup created: /Users/user/.claude/mcp_backup_20241203_143022.json

✅ Migration completed successfully!

📊 Migration Details:
  github-mcp-server → cursor_github-mcp-server (from Cursor)
  filesystem-mcp-server → cursor_filesystem-mcp-server (from Cursor)
  web-search-mcp-server → cursor_web-search-mcp-server (from Cursor)
  postgres-mcp-server → vscode_postgres-mcp-server (from VS Code)
  redis-mcp-server → vscode_redis-mcp-server (from VS Code)
```

### Configuration Structure

After migration, your Claude Code configuration will include:

```json
{
  "current": "anthropic",
  "providers": { ... },
  "mcp": {
    "cursor_github-mcp-server": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    },
    "cursor_filesystem-mcp-server": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-filesystem", "/Users/user/workspace"],
      "env": {}
    }
  }
}
```

### Best Practices

1. **Always backup**: Migration creates automatic backups before changes
2. **Review configurations**: Check migrated MCP servers work correctly
3. **Update environment variables**: Ensure API keys and tokens are available
4. **Test connections**: Verify each migrated MCP server works with Claude Code

## Examples

### Basic Usage

```bash
# List all providers
ccx list

# Show current provider
ccx current

# Switch to Anthropic
ccx use anthropic

# Test current provider
ccx test

# Test specific provider
ccx test openai

# Add new provider
ccx add my-custom-provider

# Remove provider
ccx remove old-provider

# Open config file
ccx config
```

### Advanced Usage

```bash
# Add provider with custom headers
ccx add custom-provider
# When prompted, enter JSON headers:
# {"Authorization": "Bearer token", "X-Custom": "value"}

# Test connection before switching
ccx test anthropic
ccx use anthropic

# Batch operations
ccx add provider1 && ccx add provider2 && ccx use provider1
```

### 工作原理

CCX通过管理Claude Code的配置文件来实现API提供商和模型的切换。以下是详细的工作原理：

### 核心机制

**1. 配置文件管理**
- **提供商配置**: `~/.claude/providers.json` - 存储所有API提供商的配置信息
- **Claude配置**: `~/.claude/settings.json` - Claude Code的主配置文件，CCX通过修改此文件来切换提供商

**2. 切换流程**
```
用户执行 ccx use kimi
        ↓
测试Kimi API连接
        ↓
备份当前配置
        ↓
更新providers.json中的current字段
        ↓
修改Claude settings.json：
  - model: moonshot-v1-32k
  - api_key: 用户Kimi API密钥
  - base_url: https://api.moonshot.cn/v1
        ↓
切换完成
```

### 技术实现

**配置文件结构**:
```json
// ~/.claude/providers.json
{
  "current": "kimi",
  "providers": {
    "kimi": {
      "name": "Kimi",
      "api_key": "sk-xxxxxxxx",
      "base_url": "https://api.moonshot.cn/v1",
      "model": "moonshot-v1-32k"
    },
    "anthropic": {
      "name": "Anthropic", 
      "api_key": "sk-ant-api03-xxxxxxxx",
      "base_url": "https://api.anthropic.com",
      "model": "claude-3-5-sonnet-20241022"
    }
  }
}
```

**Claude配置修改**:
当执行`ccx use kimi`时，CCX会：
1. 读取`~/.claude/settings.json`
2. 更新以下字段：
   ```json
   {
     "model": "moonshot-v1-32k",
     "api_key": "sk-your-kimi-api-key",
     "base_url": "https://api.moonshot.cn/v1"
   }
   ```
3. 保存配置文件
4. Claude Code下次启动时自动使用新配置

### 连接测试机制

CCX在切换前会测试API连接，确保目标提供商可用：

```typescript
// 发送测试请求
POST https://api.moonshot.cn/v1/chat/completions
Headers:
  Authorization: Bearer sk-your-api-key
  Content-Type: application/json
Body:
{
  "model": "moonshot-v1-32k",
  "max_tokens": 10,
  "messages": [{"role": "user", "content": "test"}]
}
```

### 安全特性

**1. 配置备份**
- 每次切换前自动创建备份文件
- 备份文件命名：`providers.json.backup.2024-xx-xx`
- 支持手动恢复配置

**2. 权限保护**
- 配置文件存储在用户主目录：`~/.claude/`
- 文件权限自动设置为仅用户可读写
- API密钥加密存储（可选）

**3. 连接验证**
- 切换前强制测试API连接
- 连接失败时需要用户确认才继续
- 显示详细的错误信息和响应时间

### 支持的API格式

**1. Anthropic格式**
```typescript
{
  "base_url": "https://api.anthropic.com",
  "headers": {
    "x-api-key": "sk-xxx",
    "anthropic-version": "2023-06-01"
  },
  "endpoint": "/v1/messages"
}
```

**2. OpenAI兼容格式**
```typescript
{
  "base_url": "https://api.openai.com/v1",
  "headers": {
    "Authorization": "Bearer sk-xxx"
  },
  "endpoint": "/chat/completions"
}
```

**3. 自定义提供商**
- 支持任何OpenAI兼容的API
- 可自定义HTTP头部
- 灵活的模型配置

### 错误处理机制

**1. 网络错误**
- 超时设置：10秒
- 自动重试机制
- 详细的错误诊断

**2. 配置错误**
- JSON格式验证
- 必填字段检查
- API密钥格式验证

**3. 恢复机制**
- 自动备份恢复
- 配置文件修复
- 紧急模式启动

## 工作流程最佳实践

**场景1：开发与测试切换**
```bash
# 开发时使用 Anthropic Claude
ccx use anthropic

# 测试长文本处理时切换到 Kimi 128K
ccx use kimi-128k

# 快速任务切换到 8K 模型
ccx use kimi-8k
```

**场景2：多模型测试**
```bash
# 为同一提供商添加不同模型配置
ccx add kimi-dev     # 开发环境用 8K
ccx add kimi-test    # 测试环境用 32K  
ccx add kimi-prod    # 生产环境用 128K

# 在不同环境间快速切换
ccx use kimi-dev
ccx use kimi-test
ccx use kimi-prod
```

**场景3：成本优化**
```bash
# 简单任务使用 8K 模型（成本更低）
ccx use kimi-8k

# 复杂任务使用 128K 模型（处理能力更强）
ccx use kimi-128k
```

## Development

### Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd ccx

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure

```
ccx/
├── src/
│   ├── cli/           # CLI command implementations
│   ├── utils/         # Utility functions
│   └── index.ts       # Main entry point
├── bin/               # Executable files
├── dist/              # Compiled output
├── package.json       # Project configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

### Building for Distribution

```bash
# Build TypeScript
npm run build

# Create executables for different platforms
npm run pkg

# The executables will be in dist/bin/
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm test -- list.test.ts
```

## 故障排除

### 常见问题

**1. 权限问题**
```bash
chmod +x bin/ccx
```

**2. 命令未找到**
- 确保包已全局安装：`npm install -g .`
- 检查 PATH 环境变量

**3. 配置文件问题**
- 检查文件权限：`ls -la ~/.claude/`
- 验证 JSON 格式：`cat ~/.claude/providers.json`

**4. API 连接问题**
- 测试 API 密钥：`ccx test <provider>`
- 检查网络连接
- 验证 API 端点 URL

### ccx use 命令特定问题

**问题：切换后模型未生效**
```bash
# 解决方案：验证切换结果
ccx current

# 如果模型不正确，手动重新切换
ccx use kimi
```

**问题：Kimi API 连接失败**
```bash
# 1. 检查 API 密钥格式
ccx add kimi
# 确保 API 密钥以 sk- 开头

# 2. 验证基础 URL
# 正确的 URL：https://api.moonshot.cn/v1
# 错误的 URL：https://api.moonshot.cn (缺少 /v1)

# 3. 测试连接
ccx test kimi
```

**问题：模型配置错误**
```bash
# 常见的 Kimi 模型名称：
# moonshot-v1-8k
# moonshot-v1-32k  
# moonshot-v1-128k

# 如果使用了错误的模型名称，重新添加提供商：
ccx remove kimi
ccx add kimi
```

### 配置文件恢复

如果配置出现问题，可以手动恢复：

```bash
# 1. 查看备份文件
ls -la ~/.claude/providers.json.backup.*

# 2. 恢复最新的备份
cp ~/.claude/providers.json.backup.2024-xx-xx ~/.claude/providers.json

# 3. 重新初始化配置
rm ~/.claude/providers.json
ccx add anthropic
```

### 调试模式

启用调试日志：

```bash
export DEBUG=ccx:*
ccx <command>
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x bin/ccx
   ```

2. **Command Not Found**
   - Make sure the package is installed globally: `npm install -g .`
   - Check your PATH environment variable

3. **Configuration File Issues**
   - Check file permissions: `ls -la ~/.claude/`
   - Validate JSON format: `cat ~/.claude/providers.json`

4. **API Connection Issues**
   - Test your API key: `ccx test <provider>`
   - Check your internet connection
   - Verify API endpoint URLs

### Debug Mode

Enable debug logging:

```bash
export DEBUG=ccx:*
ccx <command>
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the configuration examples

## Changelog

### v1.0.0
- Initial release
- Support for multiple API providers
- Connection testing
- Interactive configuration management
- Cross-platform support
- **Model switching**: Automatically switch models when changing providers
- **Enhanced documentation**: Added comprehensive usage guide with Kimi examples