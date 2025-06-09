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

# Print header
echo -e "${BOLD}${MAGENTA}CarStarz API Layer Setup and Testing${NC}"
echo -e "${CYAN}======================================${NC}\n"

# Make scripts executable
echo -e "${BLUE}Making scripts executable...${NC}"
chmod +x setup-and-verify.mjs
chmod +x test-api-endpoints.mjs
echo -e "${GREEN}Scripts are now executable${NC}\n"

# Check if node-fetch is installed
echo -e "${BLUE}Checking dependencies...${NC}"
if ! yarn list --pattern node-fetch | grep -q "node-fetch"; then
  echo -e "${YELLOW}Installing node-fetch...${NC}"
  yarn add node-fetch
else
  echo -e "${GREEN}node-fetch is already installed${NC}"
fi
echo -e "${GREEN}Dependencies checked${NC}\n"

# Run setup and verification
echo -e "${BOLD}${BLUE}Step 1: Running setup and verification${NC}"
echo -e "${CYAN}----------------------------------${NC}\n"
node setup-and-verify.mjs

# Ask if user wants to start the development server
echo -e "\n${BOLD}${BLUE}Step 2: Start development server${NC}"
echo -e "${CYAN}---------------------------${NC}\n"
read -p "Do you want to start the development server? (y/n): " start_server

if [[ $start_server == "y" || $start_server == "Y" ]]; then
  echo -e "${YELLOW}Starting development server...${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop the server when you're done testing${NC}\n"
  
  # Start the development server in the background
  yarn dev &
  server_pid=$!
  
  # Wait for server to start
  echo -e "${BLUE}Waiting for server to start...${NC}"
  sleep 10
  
  # Run API tests
  echo -e "\n${BOLD}${BLUE}Step 3: Running API tests${NC}"
  echo -e "${CYAN}----------------------${NC}\n"
  node test-api-endpoints.mjs
  
  # Ask if user wants to stop the server
  echo -e "\n${YELLOW}Development server is still running (PID: $server_pid)${NC}"
  read -p "Do you want to stop the server? (y/n): " stop_server
  
  if [[ $stop_server == "y" || $stop_server == "Y" ]]; then
    echo -e "${BLUE}Stopping development server...${NC}"
    kill $server_pid
    echo -e "${GREEN}Development server stopped${NC}"
  else
    echo -e "${YELLOW}Development server is still running in the background${NC}"
    echo -e "${YELLOW}To stop it later, run: kill $server_pid${NC}"
  fi
else
  echo -e "${YELLOW}Skipping development server start${NC}"
  echo -e "${YELLOW}You can start it manually with: yarn dev${NC}"
  
  echo -e "\n${BOLD}${BLUE}Step 3: API tests${NC}"
  echo -e "${CYAN}---------------${NC}\n"
  echo -e "${YELLOW}Skipping API tests since the development server is not running${NC}"
  echo -e "${YELLOW}You can run the tests manually with: node test-api-endpoints.mjs${NC}"
fi

echo -e "\n${BOLD}${GREEN}Setup and testing process completed!${NC}"
echo -e "${CYAN}For more information on the API structure, refer to API-LAYER-README.md${NC}\n"