#!/bin/bash

# Test script for CCX environment variable fix

echo "Testing CCX environment variable fix..."
echo "======================================"

# Test 1: Check if ccx env --export works
echo -e "\n1. Testing 'ccx env --export':"
npm run dev -- env --export

# Test 2: Check if environment variables are set
echo -e "\n2. Checking environment variables:"
echo "ANTHROPIC_AUTH_TOKEN: ${ANTHROPIC_AUTH_TOKEN:0:20}..."
echo "ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
echo "ANTHROPIC_MODEL: $ANTHROPIC_MODEL"

# Test 3: Test use command with eval mode
echo -e "\n3. Testing 'ccx use --eval' functionality:"
npm run dev -- use zhipu --eval --skip-test

# Test 4: Test switching to another provider
echo -e "\n4. Testing provider switching:"
npm run dev -- use kimi --eval --skip-test

echo -e "\n5. Final environment check:"
echo "ANTHROPIC_AUTH_TOKEN: ${ANTHROPIC_AUTH_TOKEN:0:20}..."
echo "ANTHROPIC_BASE_URL: $ANTHROPIC_BASE_URL"
echo "ANTHROPIC_MODEL: $ANTHROPIC_MODEL"

echo -e "\n✅ All tests completed!"