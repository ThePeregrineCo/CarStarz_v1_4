// Self-contained script to reset the complete database schema
// This script will:
// 1. Reset all database tables (vehicle and identity registry)
// 2. Reset the token counter
// 3. Create necessary storage buckets

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

// Initialize dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to reset the token counter
function resetTokenCounter() {
  try {
    console.log('Resetting token counter...');
    const tokenCounterPath = path.join(__dirname, 'data', 'tokenCounter.json');
    const tokenCounterData = JSON.stringify({ default: 1 }, null, 2);
    
    // Ensure the data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(tokenCounterPath, tokenCounterData);
    console.log('Token counter reset to 1');
    return true;
  } catch (error) {
    console.error('Error resetting token counter:', error);
    return false;
  }
}

// Function to create storage buckets
async function createStorageBuckets() {
  try {
    console.log('Creating storage buckets...');
    
    // Create profile-images bucket
    const { error: profileError } = await supabase.storage.createBucket(
      'profile-images',
      { public: true }
    );
    
    if (profileError && !profileError.message.includes('already exists')) {
      console.error('Error creating profile-images bucket:', profileError);
    } else {
      console.log('profile-images bucket created or already exists');
    }
    
    // Create vehicle-media bucket
    const { error: vehicleError } = await supabase.storage.createBucket(
      'vehicle-media',
      { public: true }
    );
    
    if (vehicleError && !vehicleError.message.includes('already exists')) {
      console.error('Error creating vehicle-media bucket:', vehicleError);
    } else {
      console.log('vehicle-media bucket created or already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating storage buckets:', error);
    return false;
  }
}

// Main function to reset the database
async function resetDatabase() {
  console.log('=== CarStarz Complete Database Reset ===');
  console.log('This script will reset ALL tables and data');
  console.log('');
  
  try {
    // Step 1: Reset vehicle tables using simplified schema (without storage policies)
    console.log('Step 1: Resetting vehicle tables...');
    const vehicleTablesSQL = fs.readFileSync(path.join(__dirname, 'reset-schema-simplified.sql'), 'utf8');
    
    const { error: vehicleError } = await supabase.rpc('exec_sql', { sql: vehicleTablesSQL });
    
    if (vehicleError) {
      console.error('Error executing vehicle tables SQL:', vehicleError);
      process.exit(1);
    }
    
    console.log('Vehicle tables reset successfully!');
    
    // Step 2: Create identity registry tables using simplified schema
    console.log('Step 2: Creating identity registry tables...');
    const identityTablesSQL = fs.readFileSync(path.join(__dirname, 'identity-registry-schema-simplified.sql'), 'utf8');
    
    const { error: identityError } = await supabase.rpc('exec_sql', { sql: identityTablesSQL });
    
    if (identityError) {
      console.error('Error executing identity registry SQL:', identityError);
      console.log('Continuing anyway...');
      // Don't exit, try to continue
    } else {
      console.log('Identity registry tables created successfully!');
    }
    
    // Step 3: Reset token counter
    console.log('Step 3: Resetting token counter...');
    if (!resetTokenCounter()) {
      console.error('Failed to reset token counter');
      // Continue anyway
    }
    
    // Step 4: Create storage buckets
    console.log('Step 4: Creating storage buckets...');
    if (!await createStorageBuckets()) {
      console.error('Failed to create storage buckets');
      // Continue anyway
    }
    
    // Step 5: Verify tables were created
    console.log('Step 5: Verifying tables were created...');
    const tables = [
      'vehicle_profiles',
      'vehicle_media',
      'vehicle_links',
      'vehicle_specifications',
      'identity_registry',
      'follows',
      'social_links'
    ];
    
    let allTablesCreated = true;
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`- ${table}: FAILED (${error.message})`);
          allTablesCreated = false;
        } else {
          console.log(`- ${table}: SUCCESS (table exists)`);
        }
      } catch (error) {
        console.log(`- ${table}: FAILED (${error.message})`);
        allTablesCreated = false;
      }
    }
    
    if (allTablesCreated) {
      console.log('');
      console.log('=== Complete Database Reset Successful ===');
      console.log('');
      console.log('Your database has been reset with all necessary tables:');
      console.log('- Vehicle tables (vehicle_profiles, vehicle_media, etc.)');
      console.log('- Identity registry tables (identity_registry, follows, social_links)');
      console.log('- Token counter reset to 1');
      console.log('- Storage buckets created');
      console.log('');
      console.log('You can now use the application with a clean database.');
    } else {
      console.log('');
      console.log('=== Complete Database Reset Partially Successful ===');
      console.log('');
      console.log('Some tables may not have been created correctly.');
      console.log('Please check the logs above for details.');
    }
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Execute the function
resetDatabase();