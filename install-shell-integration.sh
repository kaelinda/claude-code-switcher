#!/bin/bash

# cc-sw Shell Integration Script
# This script sets up shell functions for easier provider switching

SHELL_NAME=$(basename "$SHELL")
CONFIG_FILE=""

# Determine shell config file
case "$SHELL_NAME" in
    "zsh")
        CONFIG_FILE="$HOME/.zshrc"
        ;;
    "bash")
        if [ -f "$HOME/.bashrc" ]; then
            CONFIG_FILE="$HOME/.bashrc"
        else
            CONFIG_FILE="$HOME/.bash_profile"
        fi
        ;;
    "fish")
        CONFIG_FILE="$HOME/.config/fish/config.fish"
        ;;
    *)
        echo "Unsupported shell: $SHELL_NAME"
        exit 1
        ;;
esac

# Create backup
BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "Created backup: $BACKUP_FILE"

# Remove existing cc-sw functions
sed -i '' '/^# cc-sw - Claude Code 快速切换函数$/,/^}$/d' "$CONFIG_FILE"

# Add shell function
cat >> "$CONFIG_FILE" << 'EOF'

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
}
EOF

echo "✅ Shell functions added to: $CONFIG_FILE"
echo ""
echo "🎉 Now you can use:"
echo "  ccuse <provider>     # 快速切换 provider (立即生效)"
echo "  cc-list              # 列出所有可用 provider"
echo "  cc-current           # 显示当前 provider"
echo "  cc-test [provider]   # 测试连接"
echo ""
echo "🔄 Please restart your terminal or run: source $CONFIG_FILE"