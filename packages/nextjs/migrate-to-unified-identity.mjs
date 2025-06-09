// Migration script to combine users table and identity_registry
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local file
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env.local file...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n').reduce((acc, line) => {
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) return acc;
    
    // Parse key=value pairs
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // Set environment variable
      process.env[key] = value;
      acc[key] = value;
    }
    
    return acc;
  }, {});
  
  console.log('Loaded environment variables:', Object.keys(envVars).join(', '));
} else {
  console.log('Warning: .env.local file not found. Using environment variables from process.');
}

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('Please make sure your .env.local file contains these variables.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Execute the migration SQL script
 */
async function executeMigration() {
  try {
    console.log('Starting migration to unified identity system...');
    
    // Read the SQL migration script
    const sqlPath = path.resolve(__dirname, 'migrate-to-unified-identity.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL migration script...');
    
    // Execute the SQL script using Supabase's RPC function
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error executing SQL migration:', error);
      return false;
    }
    
    console.log('SQL migration executed successfully');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
}

/**
 * Verify the migration was successful
 */
async function verifyMigration() {
  try {
    console.log('Verifying migration...');
    
    // Check if identity_registry has the new columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'identity_registry')
      .in('column_name', ['username', 'display_name', 'bio']);
    
    if (columnsError) {
      console.error('Error checking identity_registry columns:', columnsError);
      return false;
    }
    
    if (!columns || columns.length < 3) {
      console.error('Migration verification failed: identity_registry is missing expected columns');
      return false;
    }
    
    // Check if data was migrated
    const { data: identities, error: identitiesError } = await supabase
      .from('identity_registry')
      .select('wallet_address, username, display_name')
      .not('username', 'is', null)
      .limit(5);
    
    if (identitiesError) {
      console.error('Error checking migrated data:', identitiesError);
      return false;
    }
    
    if (!identities || identities.length === 0) {
      console.warn('Warning: No migrated user data found in identity_registry');
    } else {
      console.log(`Found ${identities.length} migrated users in identity_registry`);
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying migration:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting migration to unified identity system...');
    
    // Ask for confirmation
    if (process.argv.indexOf('--confirm') === -1) {
      console.log('\n⚠️  WARNING: This script will migrate data from the users table to the identity_registry table.');
      console.log('It is recommended to backup your database before proceeding.');
      console.log('\nTo run the migration, add the --confirm flag:');
      console.log('node migrate-to-unified-identity.mjs --confirm');
      process.exit(0);
    }
    
    // Execute the migration
    const migrationSuccess = await executeMigration();
    if (!migrationSuccess) {
      console.error('Migration failed');
      process.exit(1);
    }
    
    // Verify the migration
    const verificationSuccess = await verifyMigration();
    if (!verificationSuccess) {
      console.error('Migration verification failed');
      process.exit(1);
    }
    
    console.log('\n✅ Migration to unified identity system completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application code to use the identity_registry table instead of the users table');
    console.log('2. After confirming everything works, uncomment the DROP TABLE users CASCADE; line in the SQL script');
    console.log('   and run the migration again to remove the users table');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the main function
main();