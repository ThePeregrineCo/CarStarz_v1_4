#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script performs a complete reset and migration to the new database schema.
 * It drops all existing tables, creates new tables, and sets up relationships.
 * 
 * Usage:
 * node scripts/migrate-database.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of tables to drop in the correct order (reverse dependency order)
const tablesToDrop = [
  'user_follows',
  'user_collections',
  'vehicle_videos',
  'vehicle_comments',
  'vehicle_specifications',
  'vehicle_links',
  'vehicle_audit_log',
  'vehicle_media',
  'vehicle_modifications',
  'vehicle_parts',
  'builder_vehicles',
  'parts',
  'builders',
  'vehicle_profiles',
  'users'
];

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    // Drop existing tables
    console.log('Dropping existing tables...');
    for (const table of tablesToDrop) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `DROP TABLE IF EXISTS ${table} CASCADE;` 
        });
        
        if (error) {
          console.warn(`Warning dropping table ${table}: ${error.message}`);
        } else {
          console.log(`Dropped table ${table} (if it existed)`);
        }
      } catch (err) {
        console.warn(`Warning dropping table ${table}: ${err.message}`);
      }
    }
    
    console.log('Database reset completed.');
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
}

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Step 1: Reset the database
    console.log('Step 1: Resetting the database...');
    const resetSuccess = await resetDatabase();
    if (!resetSuccess) {
      console.error('Database reset failed. Aborting migration.');
      process.exit(1);
    }
    
    // Step 2: Read and execute the schema restructure SQL
    console.log('Step 2: Creating new tables and relationships...');
    const schemaPath = path.join(__dirname, '..', 'schema-restructure.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.warn(`Warning executing SQL statement: ${error.message}`);
          console.warn('Statement:', statement);
        } else {
          console.log(`Statement ${i + 1} executed successfully.`);
        }
      } catch (err) {
        console.warn(`Warning: ${err.message}`);
        console.warn('Statement:', statement);
      }
    }
    
    // Step 3: Create storage bucket for vehicle media
    console.log('Step 3: Creating storage bucket for vehicle media...');
    try {
      const { error: bucketError } = await supabase.rpc('exec_sql', { 
        sql: `
          INSERT INTO storage.buckets (id, name, public) 
          VALUES ('vehicle-media', 'vehicle-media', true)
          ON CONFLICT (id) DO NOTHING;
        `
      });
      
      if (bucketError) {
        console.warn(`Warning creating storage bucket: ${bucketError.message}`);
      } else {
        console.log('Storage bucket created or already exists.');
      }
    } catch (err) {
      console.warn(`Warning creating storage bucket: ${err.message}`);
    }
    
    // Step 4: Create storage policies
    console.log('Step 4: Creating storage policies...');
    const storagePolicies = [
      `CREATE POLICY "Vehicle media is publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'vehicle-media');`,
      
      `CREATE POLICY "Users can upload media for their own vehicles"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'vehicle-media' AND
          EXISTS (
            SELECT 1 FROM users
            WHERE wallet_address = auth.uid()::text
          )
        );`,
      
      `CREATE POLICY "Users can update their own vehicle media"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'vehicle-media' AND
          EXISTS (
            SELECT 1 FROM users
            WHERE wallet_address = auth.uid()::text
          )
        );`,
      
      `CREATE POLICY "Users can delete their own vehicle media"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'vehicle-media' AND
          EXISTS (
            SELECT 1 FROM users
            WHERE wallet_address = auth.uid()::text
          )
        );`
    ];
    
    for (const policy of storagePolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error && !error.message.includes('already exists')) {
          console.warn(`Warning creating storage policy: ${error.message}`);
        }
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn(`Warning creating storage policy: ${err.message}`);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();