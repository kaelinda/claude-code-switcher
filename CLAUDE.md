# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **ccx** command-line tool project - a Claude Code API provider switcher that allows users to manage and switch between different API providers for Claude Code.

## Development Setup

### Prerequisites
- Node.js >= 16.0.0
- npm or yarn package manager

### Installation and Development
```bash
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

### Available Commands
```bash
# Development commands
npm run dev          # Run in development mode with ts-node
npm run build        # Build TypeScript to dist/
npm start            # Run built version from dist/
npm test             # Run Jest tests
npm run lint         # Run ESLint
npm run pkg          # Package executables for different platforms

# CLI commands (after building or running dev mode)
ccx list             # List all API providers
ccx current          # Show current provider
ccx use <provider>   # Switch to provider
ccx add <provider>   # Add new provider
ccx remove <provider> # Remove provider
ccx test [provider]  # Test API connection
ccx config           # Open config file
```

## Project Structure

```
ccx/
├── src/
│   ├── cli/           # CLI command implementations
│   │   ├── list.ts    # List providers command
│   │   ├── current.ts # Show current provider
│   │   ├── use.ts     # Switch provider
│   │   ├── add.ts     # Add provider
│   │   ├── remove.ts  # Remove provider
│   │   ├── test.ts    # Test connection
│   │   └── config.ts  # Open config file
│   ├── utils/
│   │   ├── config.ts  # Configuration management
│   │   └── api.ts     # API testing utilities
│   └── index.ts       # Main CLI entry point
├── bin/
│   └── ccx           # Executable entry point
├── dist/              # Compiled output
├── package.json       # Project configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # Complete documentation
```

## Key Dependencies

### Runtime Dependencies
- **commander**: CLI framework for command parsing
- **chalk**: Terminal string styling
- **inquirer**: Interactive command line prompts
- **axios**: HTTP client for API testing
- **fs-extra**: Enhanced file system operations
- **json5**: JSON parsing with comments support

### Development Dependencies
- **typescript**: Type-safe JavaScript
- **ts-node**: Run TypeScript directly
- **jest**: Testing framework
- **eslint**: Code linting
- **pkg**: Package executables

## Configuration

### Configuration Files
- **Main Config**: `~/.claude/providers.json` - Stores provider configurations
- **Claude Config**: `~/.claude/settings.json` - Modified to switch providers
- **Project Config**: `package.json` - Project metadata and scripts

### Provider Configuration Structure
```json
{
  "current": "anthropic",
  "providers": {
    "anthropic": {
      "name": "Anthropic",
      "api_key": "sk-...",
      "base_url": "https://api.anthropic.com",
      "model": "claude-3-5-sonnet-20241022"
    }
  }
}
```

## Development Workflow

### Adding New Features
1. Add command handler in `src/cli/`
2. Export from `src/index.ts`
3. Add TypeScript types as needed
4. Test with `npm run dev`
5. Update documentation

### Testing
- Run basic tests: `npm test`
- Test CLI commands: `npm run dev -- <command>`
- Integration tests: Add to `test-basic.js`

### Building for Distribution
```bash
npm run build        # Compile TypeScript
npm run pkg          # Create executables
```

## Code Patterns

### Error Handling
- Use try-catch blocks for async operations
- Provide user-friendly error messages with chalk
- Exit with `process.exit(1)` on errors

### Configuration Management
- Use `utils/config.ts` for all config operations
- Always create backups before modifying config
- Validate configuration before saving

### CLI Patterns
- Use commander.js for command structure
- Provide colored output with chalk
- Use inquirer for interactive prompts
- Include comprehensive help text

## Important Notes

- This tool modifies `~/.claude/settings.json` to switch providers
- API keys are stored in plain text - secure your config files
- Always test API connections before switching
- Backups are created automatically before config changes