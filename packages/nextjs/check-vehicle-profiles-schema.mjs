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

// Check the vehicle_profiles table schema
async function checkVehicleProfilesSchema() {
  try {
    console.log('Checking vehicle_profiles table schema...');
    
    // Try to insert a test record to get column information
    const testData = {
      token_id: 'test-schema-check',
      owner_wallet: '0xtest',
      name: 'Test Vehicle',
      description: 'Test vehicle for schema check',
      vin: 'TEST-VIN-123',
      make: 'Test Make',
      model: 'Test Model',
      year: 2025
    };
    
    // Try to add owner_id if it exists
    try {
      testData.owner_id = '00000000-0000-0000-0000-000000000000';
    } catch (e) {
      // Ignore errors
    }
    
    // Try to add identity_id if it exists
    try {
      testData.identity_id = '00000000-0000-0000-0000-000000000000';
    } catch (e) {
      // Ignore errors
    }
    
    console.log('Attempting to insert test record with data:', testData);
    
    const { error } = await supabase
      .from('vehicle_profiles')
      .insert([testData]);
    
    if (error) {
      console.error('Error inserting test record:', error.message);
      
      // Check if the error message contains information about the columns
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('Error message contains information about columns:', error.message);
        
        // Try to determine which column is causing the issue
        if (error.message.includes('owner_id')) {
          console.error('The owner_id column does not exist in the vehicle_profiles table.');
        } else if (error.message.includes('identity_id')) {
          console.error('The identity_id column does not exist in the vehicle_profiles table.');
        } else if (error.message.includes('owner_wallet')) {
          console.error('The owner_wallet column does not exist in the vehicle_profiles table.');
        }
      }
    } else {
      console.log('Successfully inserted test record.');
      
      // Delete the test record
      const { error: deleteError } = await supabase
        .from('vehicle_profiles')
        .delete()
        .eq('token_id', 'test-schema-check');
      
      if (deleteError) {
        console.error('Error deleting test record:', deleteError.message);
      } else {
        console.log('Successfully deleted test record.');
      }
    }
    
    // Try to get a list of all columns in the vehicle_profiles table
    console.log('\nAttempting to get column information for vehicle_profiles table...');
    
    // Create a minimal record with just the required fields
    const minimalRecord = {
      token_id: 'test-schema-check-2',
      vin: 'TEST-VIN-456',
      make: 'Test Make',
      model: 'Test Model',
      year: 2025
    };
    
    // Try inserting with just owner_wallet
    try {
      const recordWithOwnerWallet = {
        ...minimalRecord,
        owner_wallet: '0xtest2'
      };
      
      console.log('Testing if owner_wallet is a valid column...');
      const { error } = await supabase
        .from('vehicle_profiles')
        .insert([recordWithOwnerWallet]);
      
      if (error) {
        console.error('Error inserting with owner_wallet:', error.message);
        if (error.message.includes('owner_wallet') && error.message.includes('does not exist')) {
          console.error('The owner_wallet column does not exist in the vehicle_profiles table.');
        }
      } else {
        console.log('owner_wallet is a valid column in the vehicle_profiles table.');
        
        // Delete the test record
        await supabase
          .from('vehicle_profiles')
          .delete()
          .eq('token_id', 'test-schema-check-2');
      }
    } catch (e) {
      console.error('Exception testing owner_wallet column:', e);
    }
    
    // Try inserting with just owner_id
    try {
      const recordWithOwnerId = {
        ...minimalRecord,
        token_id: 'test-schema-check-3',
        owner_id: '00000000-0000-0000-0000-000000000000'
      };
      
      console.log('Testing if owner_id is a valid column...');
      const { error } = await supabase
        .from('vehicle_profiles')
        .insert([recordWithOwnerId]);
      
      if (error) {
        console.error('Error inserting with owner_id:', error.message);
        if (error.message.includes('owner_id') && error.message.includes('does not exist')) {
          console.error('The owner_id column does not exist in the vehicle_profiles table.');
        }
      } else {
        console.log('owner_id is a valid column in the vehicle_profiles table.');
        
        // Delete the test record
        await supabase
          .from('vehicle_profiles')
          .delete()
          .eq('token_id', 'test-schema-check-3');
      }
    } catch (e) {
      console.error('Exception testing owner_id column:', e);
    }
    
    // Try inserting with just identity_id
    try {
      const recordWithIdentityId = {
        ...minimalRecord,
        token_id: 'test-schema-check-4',
        identity_id: '00000000-0000-0000-0000-000000000000'
      };
      
      console.log('Testing if identity_id is a valid column...');
      const { error } = await supabase
        .from('vehicle_profiles')
        .insert([recordWithIdentityId]);
      
      if (error) {
        console.error('Error inserting with identity_id:', error.message);
        if (error.message.includes('identity_id') && error.message.includes('does not exist')) {
          console.error('The identity_id column does not exist in the vehicle_profiles table.');
        }
      } else {
        console.log('identity_id is a valid column in the vehicle_profiles table.');
        
        // Delete the test record
        await supabase
          .from('vehicle_profiles')
          .delete()
          .eq('token_id', 'test-schema-check-4');
      }
    } catch (e) {
      console.error('Exception testing identity_id column:', e);
    }
    
  } catch (error) {
    console.error('Exception during schema check:', error);
  }
}

// Run the check
checkVehicleProfilesSchema();