#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n');
  log(`${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
  console.log('-'.repeat(title.length + 8));
}

// Helper function to log success messages
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

// Helper function to log warning messages
function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Helper function to log error messages
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000/api',
  testWalletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // Example wallet address
  testTokenId: '1', // Example token ID
};

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${config.baseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    log(`Making ${method} request to ${url}`, colors.dim);
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      ok: response.ok,
    };
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    return {
      status: 0,
      data: null,
      ok: false,
      error: error.message,
    };
  }
}

// Test functions
async function testVehicleProfiles() {
  logSection('Testing Vehicle Profiles API');
  
  // Test GET /api/vehicle-profiles
  log('Testing GET /api/vehicle-profiles', colors.blue);
  const getAllResponse = await makeRequest('/vehicle-profiles');
  
  if (getAllResponse.ok) {
    logSuccess(`GET /api/vehicle-profiles returned ${getAllResponse.status}`);
    log(`Found ${getAllResponse.data.length} vehicle profiles`, colors.dim);
  } else {
    logError(`GET /api/vehicle-profiles failed with status ${getAllResponse.status}`);
    log(JSON.stringify(getAllResponse.data, null, 2), colors.red);
  }
  
  // Test GET /api/vehicle-profiles?tokenId=X
  log(`\nTesting GET /api/vehicle-profiles?tokenId=${config.testTokenId}`, colors.blue);
  const getOneResponse = await makeRequest(`/vehicle-profiles?tokenId=${config.testTokenId}`);
  
  if (getOneResponse.ok) {
    logSuccess(`GET /api/vehicle-profiles?tokenId=${config.testTokenId} returned ${getOneResponse.status}`);
    log(`Vehicle name: ${getOneResponse.data.name || 'N/A'}`, colors.dim);
  } else {
    logWarning(`GET /api/vehicle-profiles?tokenId=${config.testTokenId} failed with status ${getOneResponse.status}`);
    log(JSON.stringify(getOneResponse.data, null, 2), colors.yellow);
    log('This may be normal if the test token ID does not exist', colors.dim);
  }
  
  return getAllResponse.ok;
}

async function testUserProfiles() {
  logSection('Testing User Profiles API');
  
  // Test GET /api/user-profiles?address=X
  log(`Testing GET /api/user-profiles?address=${config.testWalletAddress}`, colors.blue);
  const response = await makeRequest(`/user-profiles?address=${config.testWalletAddress}`);
  
  if (response.ok) {
    logSuccess(`GET /api/user-profiles?address=${config.testWalletAddress} returned ${response.status}`);
    
    if (response.data.userProfile) {
      log(`User profile found: ${response.data.userProfile.username || 'No username'}`, colors.dim);
      log(`Owned vehicles: ${response.data.ownedVehicles.length}`, colors.dim);
    } else {
      log('No user profile found for this address', colors.dim);
    }
  } else {
    logError(`GET /api/user-profiles?address=${config.testWalletAddress} failed with status ${response.status}`);
    log(JSON.stringify(response.data, null, 2), colors.red);
  }
  
  return response.ok;
}

async function testBlockchainEvents() {
  logSection('Testing Blockchain Events API');
  
  // Test POST /api/blockchain-events
  log('Testing POST /api/blockchain-events', colors.blue);
  
  const eventData = {
    event_type: 'transfer',
    token_id: parseInt(config.testTokenId),
    from_address: '0x0000000000000000000000000000000000000000',
    to_address: config.testWalletAddress,
    transaction_hash: '0x' + '1'.repeat(64) // Dummy transaction hash
  };
  
  const response = await makeRequest('/blockchain-events', 'POST', eventData);
  
  if (response.ok) {
    logSuccess(`POST /api/blockchain-events returned ${response.status}`);
    log(`Event processed: ${response.data.message}`, colors.dim);
  } else {
    logWarning(`POST /api/blockchain-events failed with status ${response.status}`);
    log(JSON.stringify(response.data, null, 2), colors.yellow);
    log('This may be normal if the blockchain_events table is not set up correctly', colors.dim);
  }
  
  return response.ok;
}

// Main test function
async function runTests() {
  log(`${colors.bright}${colors.magenta}CarStarz API Endpoint Tests${colors.reset}`, colors.bright);
  log(`Running tests at ${new Date().toLocaleString()}`, colors.dim);
  console.log('\n');
  
  log('Make sure the development server is running!', colors.yellow);
  log('If not, run: cd packages/nextjs && yarn dev', colors.yellow);
  console.log('\n');
  
  // Run tests
  const vehicleProfilesResult = await testVehicleProfiles();
  const userProfilesResult = await testUserProfiles();
  const blockchainEventsResult = await testBlockchainEvents();
  
  // Summary
  logSection('Test Summary');
  
  if (vehicleProfilesResult) {
    logSuccess('Vehicle Profiles API: PASSED');
  } else {
    logError('Vehicle Profiles API: FAILED');
  }
  
  if (userProfilesResult) {
    logSuccess('User Profiles API: PASSED');
  } else {
    logError('User Profiles API: FAILED');
  }
  
  if (blockchainEventsResult) {
    logSuccess('Blockchain Events API: PASSED');
  } else {
    logWarning('Blockchain Events API: NEEDS ATTENTION');
  }
  
  console.log('\n');
  if (vehicleProfilesResult && userProfilesResult && blockchainEventsResult) {
    log('🎉 All tests passed! The API layer is working correctly.', colors.green);
  } else {
    log('⚠️ Some tests failed. Please check the logs for details.', colors.yellow);
  }
  
  log('\nFor more information on the API structure, refer to API-LAYER-README.md', colors.cyan);
}

// Run the tests
runTests().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
});