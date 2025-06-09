#!/bin/bash

# Install dependencies for the test script
echo "Installing dependencies for the media upload test script..."
npm install --save-dev node-fetch@3 form-data

echo "Dependencies installed successfully!"
echo "You can now run the test script with: node test-media-upload.mjs"