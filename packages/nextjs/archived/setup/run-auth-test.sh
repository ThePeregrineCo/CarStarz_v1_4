#!/bin/bash

# Make the script executable
chmod +x test-auth-process.mjs

# Install required dependencies
echo "Installing required dependencies..."
npm install dotenv ethers@^5.7.2 @supabase/supabase-js

# Run the test script
echo "Running authentication test script..."
node test-auth-process.mjs