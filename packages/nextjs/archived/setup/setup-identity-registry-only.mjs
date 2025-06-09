// Script to set up only the identity registry tables without affecting existing vehicle tables
// This script will:
// 1. Create identity registry tables
// 2. Not touch any existing vehicle tables

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

// Main function to set up identity registry
async function setupIdentityRegistry() {
  console.log('=== Setting Up Identity Registry Tables ===');
  console.log('This script will create identity registry tables without affecting existing vehicle tables');
  console.log('');
  
  try {
    // Create identity registry tables
    console.log('Creating identity registry tables...');
    const identityTablesSQL = fs.readFileSync(path.join(__dirname, 'identity-registry-schema-simplified.sql'), 'utf8');
    
    // Split the SQL into individual statements
    const statements = identityTablesSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    let hasError = false;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim() + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        hasError = true;
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    if (hasError) {
      console.warn('Some SQL statements had errors, but continuing anyway...');
    } else {
      console.log('All SQL statements executed successfully!');
    }
    
    // Verify tables were created
    console.log('Verifying tables were created...');
    const tables = [
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
      console.log('=== Identity Registry Setup Successful ===');
      console.log('');
      console.log('Your database now has the following identity registry tables:');
      console.log('- identity_registry: Stores user profile information');
      console.log('- follows: Tracks user follow relationships');
      console.log('- social_links: Stores links to social media profiles');
      console.log('');
      console.log('You can now use the application with the identity registry system.');
    } else {
      console.log('');
      console.log('=== Identity Registry Setup Partially Successful ===');
      console.log('');
      console.log('Some tables may not have been created correctly.');
      console.log('Please check the logs above for details.');
    }
  } catch (error) {
    console.error('Error setting up identity registry:', error);
    process.exit(1);
  }
}

// Execute the function
setupIdentityRegistry();