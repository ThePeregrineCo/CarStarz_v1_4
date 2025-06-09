// Simplified Identity Registry Setup Script
// This script sets up the identity registry tables in Supabase using the consolidated SQL file

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'OK' : 'MISSING'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'OK' : 'MISSING'}`);
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupIdentityRegistry() {
  try {
    console.log('Setting up identity registry...');
    
    // Read the consolidated SQL script
    const sqlScript = fs.readFileSync(path.resolve(__dirname, 'identity-registry-schema.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the rpc function to execute SQL directly
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with the next statement
        }
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Continue with the next statement
      }
    }
    
    console.log('Identity registry setup complete!');
    
    // Verify the tables were created
    console.log('\nVerifying tables...');
    
    // Check identity_registry
    try {
      const { data: identities, error: identitiesError } = await supabase
        .from('identity_registry')
        .select('count(*)', { count: 'exact', head: true });
      
      if (identitiesError) {
        console.log('- identity_registry: FAILED (Error:', identitiesError.message, ')');
      } else {
        console.log(`- identity_registry: SUCCESS (${identities[0]?.count || 0} records)`);
      }
    } catch (error) {
      console.log('- identity_registry: FAILED (Error:', error.message, ')');
    }
    
    // Check follows
    try {
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('count(*)', { count: 'exact', head: true });
      
      if (followsError) {
        console.log('- follows: FAILED (Error:', followsError.message, ')');
      } else {
        console.log(`- follows: SUCCESS (${follows[0]?.count || 0} records)`);
      }
    } catch (error) {
      console.log('- follows: FAILED (Error:', error.message, ')');
    }
    
    // Check social_links
    try {
      const { data: socialLinks, error: socialLinksError } = await supabase
        .from('social_links')
        .select('count(*)', { count: 'exact', head: true });
      
      if (socialLinksError) {
        console.log('- social_links: FAILED (Error:', socialLinksError.message, ')');
      } else {
        console.log(`- social_links: SUCCESS (${socialLinks[0]?.count || 0} records)`);
      }
    } catch (error) {
      console.log('- social_links: FAILED (Error:', error.message, ')');
    }
    
  } catch (error) {
    console.error('Error setting up identity registry:', error);
  }
}

// Run the setup
setupIdentityRegistry();