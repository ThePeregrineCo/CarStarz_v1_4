#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Exit on error
set -e

echo -e "${BOLD}${MAGENTA}=== CarStarz Hardhat Contract Reset and Deployment ===${NC}"
echo -e "${CYAN}This script will reset the hardhat contracts and deploy them to the local network${NC}"
echo -e "${YELLOW}WARNING: This will delete all existing NFTs in the contracts${NC}"
echo

# Confirm with the user
read -p "Are you sure you want to proceed? This will delete all existing NFTs. (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Operation cancelled.${NC}"
    exit 1
fi

# Navigate to the hardhat directory
cd ../hardhat

echo -e "\n${BOLD}${BLUE}Step 1: Clearing existing contract data...${NC}"

# Reset the local hardhat node
echo -e "${CYAN}Resetting local hardhat node...${NC}"
yarn hardhat clean

# Check if a hardhat node is running
if lsof -i:8545 > /dev/null; then
    echo -e "${YELLOW}A hardhat node is currently running. Stopping it...${NC}"
    # Find the process ID of the hardhat node
    PID=$(lsof -i:8545 -t)
    kill $PID
    echo -e "${GREEN}Hardhat node stopped.${NC}"
    # Wait a moment to ensure the port is released
    sleep 2
fi

# Reset the token counter
echo -e "${CYAN}Resetting token counter...${NC}"
mkdir -p ../nextjs/data
cat > ../nextjs/data/tokenCounter.json << 'EOL'
{
  "counter": 1
}
EOL

echo -e "\n${BOLD}${BLUE}Step 2: Starting local hardhat node...${NC}"

# Start a local hardhat node in the background
echo -e "${CYAN}Starting local hardhat node...${NC}"
yarn hardhat node --network hardhat > hardhat_node.log 2>&1 &
NODE_PID=$!

# Wait for the node to start
echo -e "${CYAN}Waiting for hardhat node to start...${NC}"
sleep 10

# Check if the node is running
if ! lsof -i:8545 > /dev/null; then
    echo -e "${RED}Failed to start hardhat node. Check hardhat_node.log for details.${NC}"
    exit 1
fi

echo -e "${GREEN}Hardhat node started successfully.${NC}"

echo -e "\n${BOLD}${BLUE}Step 3: Deploying contracts...${NC}"

# Deploy the contracts
echo -e "${CYAN}Deploying contracts...${NC}"
yarn hardhat deploy --network hardhat

echo -e "\n${BOLD}${BLUE}Step 4: Verifying deployment...${NC}"

# Check if the contracts were deployed successfully
echo -e "${CYAN}Checking contract deployment...${NC}"
if [ -f "scripts/checkContract.ts" ]; then
    yarn hardhat run scripts/checkContract.ts --network hardhat
else
    echo -e "${YELLOW}checkContract.ts script not found. Skipping verification.${NC}"
    echo -e "${YELLOW}You can manually verify the contracts by checking the deployedContracts.ts file.${NC}"
fi

# Navigate back to the nextjs directory
cd ../nextjs

echo
echo -e "${BOLD}${GREEN}=== Hardhat Reset and Deployment Complete ===${NC}"
echo -e "${CYAN}The hardhat contracts have been reset and redeployed.${NC}"
echo -e "${CYAN}A local hardhat node is running in the background (PID: ${NODE_PID}).${NC}"
echo -e "${CYAN}You can now start your development server and test the app with fresh contracts.${NC}"
echo
echo -e "${YELLOW}To stop the hardhat node later, run: kill ${NODE_PID}${NC}"