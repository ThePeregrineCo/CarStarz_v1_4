#!/bin/bash

# Change to the project root directory
cd "$(dirname "$0")/.."

# Run the test script
echo "Running vehicle profile creation test..."
node test-vehicle-profile-creation.mjs