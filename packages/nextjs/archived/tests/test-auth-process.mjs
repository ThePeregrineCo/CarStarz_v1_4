import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables:');
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Found' : 'Missing'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? 'Found' : 'Missing'}`);
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Create a test wallet
const wallet = ethers.Wallet.createRandom();
const walletAddress = wallet.address;
const normalizedWallet = walletAddress.toLowerCase();

console.log(`Created test wallet: ${walletAddress}`);
console.log(`Normalized wallet: ${normalizedWallet}`);

// Function to check if the identity_registry table exists
async function checkIdentityRegistryTable() {
  console.log('\n--- Checking if identity_registry table exists ---');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'identity_registry')
      .single();
    
    if (error) {
      console.error('Error checking identity_registry table:', error);
      return false;
    }
    
    if (data) {
      console.log('identity_registry table exists');
      return true;
    } else {
      console.log('identity_registry table does not exist');
      return false;
    }
  } catch (error) {
    console.error('Error checking identity_registry table:', error);
    return false;
  }
}

// Function to create a user in the users table
async function createUser() {
  console.log('\n--- Creating user in users table ---');
  
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedWallet)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking if user exists:', checkError);
      return null;
    }
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return existingUser;
    }
    
    // Create a new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        { 
          wallet_address: normalizedWallet,
          username: `test_user_${normalizedWallet.substring(2, 8)}`,
        }
      ])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating user:', createError);
      return null;
    }
    
    console.log('User created successfully:', newUser);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Function to register wallet in identity registry
async function registerWalletInIdentityRegistry(userId) {
  console.log('\n--- Registering wallet in identity registry ---');
  
  try {
    // Check if the identity_registry table exists
    const tableExists = await checkIdentityRegistryTable();
    if (!tableExists) {
      console.log('Skipping registration as identity_registry table does not exist');
      return false;
    }
    
    // Check if wallet is already registered
    const { data: existingIdentity, error: lookupError } = await supabase
      .from('identity_registry')
      .select('*')
      .eq('normalized_wallet', normalizedWallet)
      .maybeSingle();
    
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Error looking up identity:', lookupError);
      return false;
    }
    
    if (existingIdentity) {
      console.log('Wallet already registered, updating last_login');
      
      // Update the existing identity
      const { error: updateError } = await supabase
        .from('identity_registry')
        .update({
          last_login: new Date().toISOString(),
          user_id: userId || existingIdentity.user_id,
        })
        .eq('id', existingIdentity.id);
      
      if (updateError) {
        console.error('Error updating identity:', updateError);
        return false;
      }
      
      console.log('Identity updated successfully');
      return true;
    } else {
      console.log('Wallet not registered, creating new identity');
      
      // Create a new identity
      const { data: newIdentity, error: insertError } = await supabase
        .from('identity_registry')
        .insert({
          wallet_address: walletAddress,
          normalized_wallet: normalizedWallet,
          user_id: userId,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting identity:', insertError);
        return false;
      }
      
      console.log('Identity created successfully:', newIdentity);
      return true;
    }
  } catch (error) {
    console.error('Error registering wallet in identity registry:', error);
    return false;
  }
}

// Function to check if a user is the owner of a vehicle
async function checkVehicleOwnership(tokenId) {
  console.log(`\n--- Checking if user is owner of vehicle ${tokenId} ---`);
  
  try {
    // Query the vehicles table
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicle_profiles')
      .select('*')
      .eq('token_id', tokenId)
      .eq('owner_wallet', normalizedWallet)
      .maybeSingle();
    
    if (vehicleError) {
      console.error('Error checking vehicle ownership:', vehicleError);
      return false;
    }
    
    if (vehicle) {
      console.log('User is the owner of the vehicle');
      return true;
    } else {
      console.log('User is NOT the owner of the vehicle');
      return false;
    }
  } catch (error) {
    console.error('Error checking vehicle ownership:', error);
    return false;
  }
}

// Function to list all vehicles
async function listVehicles() {
  console.log('\n--- Listing all vehicles ---');
  
  try {
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicle_profiles')
      .select('token_id, owner_wallet, name, make, model, year')
      .limit(10);
    
    if (vehiclesError) {
      console.error('Error listing vehicles:', vehiclesError);
      return;
    }
    
    console.log(`Found ${vehicles.length} vehicles:`);
    vehicles.forEach(vehicle => {
      console.log(`- Token ID: ${vehicle.token_id}, Owner: ${vehicle.owner_wallet}, Name: ${vehicle.name || 'Unnamed'}, Make: ${vehicle.make}, Model: ${vehicle.model}, Year: ${vehicle.year}`);
    });
  } catch (error) {
    console.error('Error listing vehicles:', error);
  }
}

// Main function to run all tests
async function main() {
  console.log('=== Testing Authentication Process ===');
  
  // Create a user
  const user = await createUser();
  if (!user) {
    console.error('Failed to create user, exiting');
    process.exit(1);
  }
  
  // Register wallet in identity registry
  const registered = await registerWalletInIdentityRegistry(user.id);
  console.log(`Wallet registration ${registered ? 'successful' : 'failed'}`);
  
  // List vehicles
  await listVehicles();
  
  // Check ownership of vehicle with token ID 5
  const isOwner = await checkVehicleOwnership(5);
  console.log(`User is ${isOwner ? '' : 'NOT '}the owner of vehicle with token ID 5`);
  
  console.log('\n=== Authentication Process Test Complete ===');
}

// Run the main function
main()
  .catch(error => {
    console.error('Error in main function:', error);
    process.exit(1);
  })
  .finally(() => {
    // Close the Supabase connection
    supabase.auth.signOut();
  });