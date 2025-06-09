#!/bin/bash

# Install SIWE dependencies
echo "Installing SIWE dependencies..."
yarn add siwe @web3modal/siwe

# Install other required dependencies if not already installed
echo "Installing other required dependencies..."
yarn add @supabase/supabase-js @supabase/auth-helpers-nextjs

echo "Dependencies installed successfully!"