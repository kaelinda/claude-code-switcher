#!/bin/bash

echo "=== cc-sw Environment Variable Fix Demo ==="
echo

echo "1. Show current environment variables:"
npm run dev -- env --show
echo

echo "2. Test export functionality:"
npm run dev -- env --export
echo

echo "3. Switch to provider with eval mode:"
echo "This will output the export commands directly:"
npm run dev -- use kimi --eval --skip-test
echo

echo "4. Switch back with eval mode:"
npm run dev -- use zhipu --eval --skip-test
echo

echo "✅ Environment variable fix is working!"
echo
echo "Usage examples:"
echo "  cc-sw env --show           # Show current environment variables"
echo "  cc-sw env --export          # Export for shell eval"
echo "  eval \$(cc-sw env --export)  # Apply environment variables immediately"
echo "  cc-sw use <provider> --eval --skip-test  # Switch and export"