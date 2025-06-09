#!/usr/bin/env node

/**
 * Script to verify that the schema has been set up correctly
 * This script checks if the identity_registry table exists and if it has the admin user
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: join(__dirname, '.env') });

// Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl || 'Not found');
console.log('Supabase Service Role Key available:', !!supabaseServiceRoleKey);

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Test the connection and verify schema setup
async function verifySchemaSetup() {
  try {
    console.log('Verifying schema setup...');
    
    // Check if identity_registry table exists
    console.log('\nChecking if identity_registry table exists...');
    try {
      const { error } = await supabase
        .from('identity_registry')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Error accessing identity_registry table:', error.message);
        console.log('The identity_registry table might not exist or you might not have permission to access it.');
      } else {
        console.log('Successfully accessed identity_registry table!');
        console.log('Table exists and is accessible.');
      }
    } catch (tableError) {
      console.error('Exception when accessing identity_registry table:', tableError.message);
    }
    
    // Check if admin user exists
    console.log('\nChecking if admin user exists...');
    try {
      const { data, error } = await supabase
        .from('identity_registry')
        .select('*')
        .eq('is_admin', true)
        .limit(1);
      
      if (error) {
        console.error('Error checking for admin user:', error.message);
      } else if (data && data.length > 0) {
        console.log('Admin user found!');
        console.log('Admin details:', {
          id: data[0].id,
          username: data[0].username,
          wallet_address: data[0].wallet_address
        });
      } else {
        console.log('No admin user found in the identity_registry table.');
      }
    } catch (adminError) {
      console.error('Exception when checking for admin user:', adminError.message);
    }
    
    // List all tables in the public schema by checking if key tables exist
    console.log('\nChecking for key tables in the public schema...');
    const keyTables = [
      'identity_registry',
      'vehicle_profiles',
      'token_ownership',
      'verification_levels',
      'follows',
      'social_links',
      'vehicle_media',
      'vehicle_modifications'
    ];
    
    let tablesFound = 0;
    for (const tableName of keyTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table '${tableName}' exists`);
          tablesFound++;
        } else {
          console.log(`❌ Table '${tableName}' does not exist or is not accessible`);
        }
      } catch {
        console.log(`❌ Table '${tableName}' does not exist or is not accessible`);
      }
    }
    
    if (tablesFound === 0) {
      console.log('No tables found in the public schema.');
    } else {
      console.log(`Found ${tablesFound} out of ${keyTables.length} key tables.`);
    }
    
    // Count records in key tables
    console.log('\nCounting records in key tables...');
    const tablesToCheck = [
      'identity_registry',
      'vehicle_profiles',
      'token_ownership',
      'verification_levels'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true });
        
        if (error) {
          console.error(`Error counting records in ${tableName}:`, error.message);
        } else {
          console.log(`${tableName}: ${data?.length || 0} records`);
        }
      } catch (countError) {
        console.error(`Exception when counting records in ${tableName}:`, countError.message);
      }
    }
    
  } catch (error) {
    console.error('Exception when verifying schema setup:', error.message);
    console.error(error);
  }
}

verifySchemaSetup();