#!/bin/bash

# Script to run clean database migration
# This script runs the clean migration script that sets up the entire database from scratch

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${YELLOW}==== $1 ====${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check if the clean schema file exists
if [ ! -f "infrastructure/database/migrations/01-clean-schema.sql" ]; then
  print_error "Clean schema file not found at infrastructure/database/migrations/01-clean-schema.sql"
  exit 1
fi

print_header "Running clean migration"
echo "This script will reset your entire database and recreate all tables from scratch."
echo "All existing data will be lost."
echo ""
echo "Are you sure you want to continue? (y/n)"
read -p "> " run_now

if [ "$run_now" = "y" ] || [ "$run_now" = "Y" ]; then
  node packages/nextjs/run-clean-migration.mjs
else
  echo "Migration not executed. Run it manually when ready."
fi