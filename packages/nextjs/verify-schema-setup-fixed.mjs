#!/usr/bin/env node

/**
 * Script to verify that the schema has been set up correctly
 * This script checks if the identity_registry table exists and if it has the admin user
 * FIXED VERSION: Uses a more robust method to check for table existence
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
    
    // Define tables with their primary key columns
    const keyTables = [
      { name: 'identity_registry', key: 'id' },
      { name: 'vehicle_profiles', key: 'id' },
      { name: 'token_ownership', key: 'token_id' }, // Use token_id instead of id
      { name: 'verification_levels', key: 'id' },
      { name: 'follows', key: 'id' },
      { name: 'social_links', key: 'id' },
      { name: 'vehicle_media', key: 'id' },
      { name: 'vehicle_modifications', key: 'id' }
    ];
    
    let tablesFound = 0;
    for (const table of keyTables) {
      try {
        // Use a more robust method to check if the table exists
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = '${table.name}'
            ) as table_exists;
          `
        });
        
        if (error) {
          console.error(`Error checking if ${table.name} exists:`, error.message);
          console.log(`❌ Table '${table.name}' could not be verified`);
          continue;
        }
        
        if (data && data[0]?.table_exists) {
          console.log(`✅ Table '${table.name}' exists`);
          tablesFound++;
        } else {
          console.log(`❌ Table '${table.name}' does not exist`);
        }
      } catch (error) {
        console.error(`Exception when checking if ${table.name} exists:`, error.message);
        console.log(`❌ Table '${table.name}' could not be verified`);
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
      { name: 'identity_registry', key: 'id' },
      { name: 'vehicle_profiles', key: 'id' },
      { name: 'token_ownership', key: 'token_id' }, // Use token_id instead of id
      { name: 'verification_levels', key: 'id' }
    ];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `SELECT COUNT(*) as count FROM ${table.name};`
        });
        
        if (error) {
          console.error(`Error counting records in ${table.name}:`, error.message);
        } else {
          console.log(`${table.name}: ${data[0]?.count || 0} records`);
        }
      } catch (countError) {
        console.error(`Exception when counting records in ${table.name}:`, countError.message);
      }
    }
    
  } catch (error) {
    console.error('Exception when verifying schema setup:', error.message);
    console.error(error);
  }
}

verifySchemaSetup();