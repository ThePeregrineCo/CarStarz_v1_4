import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local or .env
console.log('Loading environment variables...');
try {
  // Try .env.local first
  const envLocalPath = join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log(`Loading environment variables from ${envLocalPath}`);
    dotenv.config({ path: envLocalPath });
  } else {
    // Fall back to .env
    const envPath = join(__dirname, '.env');
    console.log(`Loading environment variables from ${envPath}`);
    dotenv.config({ path: envPath });
  }
} catch (error) {
  console.warn(`Warning: Error loading environment variables: ${error.message}`);
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Explicitly set from .env file if not found in environment
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Environment variables not found in process.env, trying to read directly from .env file...');
  try {
    const envPath = join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) {
          process.env.NEXT_PUBLIC_SUPABASE_URL = value.trim();
          console.log(`Manually set NEXT_PUBLIC_SUPABASE_URL to ${value.trim()}`);
        } else if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY' && !supabaseServiceRoleKey) {
          process.env.SUPABASE_SERVICE_ROLE_KEY = value.trim();
          console.log('Manually set SUPABASE_SERVICE_ROLE_KEY');
        }
      }
    }
  } catch (error) {
    console.error(`Error reading .env file: ${error.message}`);
  }
}

// Check again after manual loading
const finalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const finalSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', finalSupabaseUrl || 'Not found');
console.log('Supabase Service Role Key available:', !!finalSupabaseServiceRoleKey);

// Create a Supabase client
const supabase = createClient(finalSupabaseUrl, finalSupabaseServiceRoleKey);

// Test vehicle profile creation
async function testVehicleProfileCreation() {
  try {
    console.log('Testing vehicle profile creation...');
    
    // Generate a unique test token ID
    const testTokenId = `test-${Date.now()}`;
    const testWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    console.log(`Creating test vehicle profile with token ID: ${testTokenId}`);
    
    // Step 1: Check if the identity registry exists and has the wallet
    console.log('Step 1: Checking identity registry...');
    try {
      const { data: identityData, error: identityError } = await supabase
        .from('identity_registry')
        .select('id, normalized_wallet')
        .eq('normalized_wallet', testWalletAddress.toLowerCase())
        .maybeSingle();
      
      if (identityError) {
        console.error('Error checking identity registry:', identityError.message);
        if (identityError.code === '42P01') {
          console.error('The identity_registry table does not exist.');
        }
      } else {
        console.log('Identity registry check successful.');
        if (identityData) {
          console.log('Found identity for wallet:', identityData);
        } else {
          console.log('No identity found for wallet, creating one...');
          
          // Create a test identity
          const { data: newIdentity, error: createIdentityError } = await supabase
            .from('identity_registry')
            .insert([
              {
                wallet_address: testWalletAddress,
                normalized_wallet: testWalletAddress.toLowerCase(),
                username: `test-user-${Date.now()}`,
                display_name: 'Test User',
                bio: 'This is a test user created for testing vehicle profile creation.'
              }
            ])
            .select()
            .single();
          
          if (createIdentityError) {
            console.error('Error creating identity:', createIdentityError.message);
          } else {
            console.log('Created test identity:', newIdentity);
          }
        }
      }
    } catch (identityCheckError) {
      console.error('Exception checking identity registry:', identityCheckError);
    }
    
    // Step 2: Check if the vehicle_profiles table exists
    console.log('\nStep 2: Checking vehicle_profiles table...');
    try {
      const { error: vehicleProfilesError } = await supabase
        .from('vehicle_profiles')
        .select('count(*)', { count: 'exact', head: true });
      
      if (vehicleProfilesError) {
        console.error('Error checking vehicle_profiles table:', vehicleProfilesError.message);
        if (vehicleProfilesError.code === '42P01') {
          console.error('The vehicle_profiles table does not exist.');
        }
      } else {
        console.log('Vehicle profiles table check successful.');
      }
    } catch (vehicleProfilesCheckError) {
      console.error('Exception checking vehicle_profiles table:', vehicleProfilesCheckError);
    }
    
    // Step 3: Try to create a vehicle profile
    console.log('\nStep 3: Creating a test vehicle profile...');
    try {
      // Get the identity ID for the test wallet
      const { data: identity, error: identityError } = await supabase
        .from('identity_registry')
        .select('id')
        .eq('normalized_wallet', testWalletAddress.toLowerCase())
        .maybeSingle();
      
      if (identityError) {
        console.error('Error getting identity ID:', identityError.message);
      } else if (!identity) {
        console.error('No identity found for wallet, cannot create vehicle profile.');
      } else {
        console.log('Found identity ID:', identity.id);
        
        // Create a test vehicle profile
        const vehicleProfileData = {
          token_id: testTokenId,
          owner_wallet: testWalletAddress.toLowerCase(),
          owner_id: identity.id,
          name: `Test Vehicle ${testTokenId}`,
          description: `Test vehicle created for testing profile creation.`,
          vin: `TEST-VIN-${testTokenId}`,
          make: 'Test Make',
          model: 'Test Model',
          year: new Date().getFullYear(),
        };
        
        console.log('Creating vehicle profile with data:', vehicleProfileData);
        
        const { data: newVehicle, error: createVehicleError } = await supabase
          .from('vehicle_profiles')
          .insert([vehicleProfileData])
          .select()
          .single();
        
        if (createVehicleError) {
          console.error('Error creating vehicle profile:', createVehicleError.message);
          
          // Check if the error is related to a foreign key constraint
          if (createVehicleError.code === '23503') {
            console.error('Foreign key constraint violation. This could be related to the owner_id reference.');
          }
          
          // Check if the error is related to a unique constraint
          if (createVehicleError.code === '23505') {
            console.error('Unique constraint violation. A vehicle with this token_id might already exist.');
          }
        } else {
          console.log('Successfully created test vehicle profile:', newVehicle);
          
          // Step 4: Try to create a vehicle audit log entry
          console.log('\nStep 4: Creating a test audit log entry...');
          try {
            const detailsJson = {
              content: 'Test audit log entry',
              user_wallet: testWalletAddress.toLowerCase()
            };
            
            const { data: auditLog, error: auditLogError } = await supabase
              .from('vehicle_audit_log')
              .insert([
                {
                  vehicle_id: newVehicle.id,
                  action: 'test_action',
                  details: detailsJson,
                }
              ])
              .select()
              .single();
            
            if (auditLogError) {
              console.error('Error creating audit log entry:', auditLogError.message);
              
              if (auditLogError.code === '42P01') {
                console.error('The vehicle_audit_log table does not exist.');
              }
            } else {
              console.log('Successfully created test audit log entry:', auditLog);
            }
          } catch (auditLogError) {
            console.error('Exception creating audit log entry:', auditLogError);
          }
        }
      }
    } catch (createVehicleError) {
      console.error('Exception creating vehicle profile:', createVehicleError);
    }
  } catch (error) {
    console.error('Exception during test:', error);
  }
}

// Run the test
testVehicleProfileCreation();