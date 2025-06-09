#!/bin/bash

# Main setup script for the new architecture
# This script will run all the necessary steps to set up the new architecture

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

# Make scripts executable
chmod +x scripts/archive-old-files.sh
chmod +x scripts/consolidate-migrations.sh

# Step 1: Archive old files
print_header "Step 1: Archiving old files"
if ./scripts/archive-old-files.sh; then
  print_success "Old files archived successfully"
else
  print_error "Failed to archive old files"
  exit 1
fi

# Step 2: Consolidate migrations
print_header "Step 2: Consolidating migrations"
if ./scripts/consolidate-migrations.sh; then
  print_success "Migrations consolidated successfully"
else
  print_error "Failed to consolidate migrations"
  exit 1
fi

# Step 3: Install required dependencies
print_header "Step 3: Installing required dependencies"
echo "Installing zod for validation..."
if yarn add zod; then
  print_success "Zod installed successfully"
else
  print_error "Failed to install zod"
  exit 1
fi

# Step 4: Update tsconfig.json to enable path aliases
print_header "Step 4: Updating tsconfig.json"
cat > packages/nextjs/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
print_success "tsconfig.json updated successfully"

# Step 5: Create a README.md file for the new architecture
print_header "Step 5: Creating README.md"
cat > packages/nextjs/README.md << EOF
# CarStarz Application

This application has been refactored to follow clean architecture principles.

## Directory Structure

- \`app/\`: Next.js App Router pages and API routes
- \`components/\`: React components
- \`core/\`: Domain models, interfaces, and business logic
  - \`entities/\`: Core domain entities
  - \`repositories/\`: Repository interfaces
  - \`services/\`: Business logic services
  - \`controllers/\`: API controllers
  - \`errors/\`: Domain-specific error classes
- \`infrastructure/\`: External dependencies implementation
  - \`database/\`: Database access (Supabase)
    - \`migrations/\`: SQL migrations
    - \`repositories/\`: Repository implementations
  - \`blockchain/\`: Blockchain interactions
  - \`storage/\`: File storage implementations
  - \`di/\`: Dependency injection container
- \`lib/\`: Shared utilities and helpers
  - \`api/\`: API utilities
  - \`utils/\`: General utilities
  - \`hooks/\`: React hooks
- \`scripts/\`: Maintenance and setup scripts
- \`archived/\`: Old files from the previous architecture

## Getting Started

1. Install dependencies: \`yarn install\`
2. Set up environment variables: Copy \`.env.example\` to \`.env.local\` and fill in the values
3. Run the development server: \`yarn dev\`

## API Routes

- \`GET /api/vehicles\`: Get all vehicles
- \`POST /api/vehicles\`: Create a new vehicle
- \`GET /api/vehicles/[tokenId]\`: Get a vehicle by token ID
- \`PUT /api/vehicles/[tokenId]\`: Update a vehicle
- \`GET /api/vehicles/[tokenId]/media\`: Get media for a vehicle
- \`POST /api/vehicles/[tokenId]/media\`: Add media to a vehicle
- \`DELETE /api/vehicles/media/[mediaId]\`: Delete media

## Authentication

Authentication is handled using wallet addresses. The API expects a wallet address in the \`x-wallet-address\` header.
EOF
print_success "README.md created successfully"

print_header "Setup Complete"
echo -e "The new architecture has been set up successfully. You can now run the application with ${GREEN}yarn dev${NC}."
echo -e "See ${GREEN}packages/nextjs/README.md${NC} for more information."