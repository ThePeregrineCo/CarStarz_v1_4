#!/bin/bash

# Script to kill process 8584 and clear Hardhat and frontend caches

echo "Killing process 8584..."
kill 8584 2>/dev/null || echo "Process 8584 not found or already terminated"

echo "Clearing Hardhat cache..."
rm -rf packages/hardhat/cache
rm -rf packages/hardhat/artifacts
echo "Hardhat cache cleared"

echo "Clearing frontend caches..."
rm -rf packages/nextjs/.next
rm -rf packages/nextjs/node_modules/.cache
echo "Frontend caches cleared"

echo "Clearing any temporary files..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
echo "Temporary files cleared"

echo "All caches cleared successfully!"