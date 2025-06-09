import { createClient } from '@supabase/supabase-js';
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

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Get list of tables
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log('\nTables in the database:');
    tables.forEach(table => {
      console.log(`- ${table.tablename}`);
    });
    
    // Check identity_registry
    await checkTable('identity_registry');
    
    // Check follows
    await checkTable('follows');
    
    // Check social_links
    await checkTable('social_links');
    
    // Check vehicle_profiles
    await checkTable('vehicle_profiles');
    
    // Check vehicle_media
    await checkTable('vehicle_media');
    
    // Check vehicle_videos
    await checkTable('vehicle_videos');
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

async function checkTable(tableName) {
  try {
    console.log(`\nChecking table: ${tableName}`);
    
    // Check if table exists
    const { data: tableExists, error: tableExistsError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', tableName)
      .maybeSingle();
    
    if (tableExistsError) {
      console.error(`Error checking if ${tableName} exists:`, tableExistsError);
      return;
    }
    
    if (!tableExists) {
      console.log(`Table ${tableName} does not exist.`);
      return;
    }
    
    // Get count of records
    const { data: count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error(`Error getting count for ${tableName}:`, countError);
      return;
    }
    
    console.log(`Table ${tableName} has ${count.length} records.`);
    
    // Get sample records
    const { data: records, error: recordsError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (recordsError) {
      console.error(`Error getting records for ${tableName}:`, recordsError);
      return;
    }
    
    if (records.length > 0) {
      console.log(`Sample records from ${tableName}:`);
      records.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, JSON.stringify(record, null, 2));
      });
    } else {
      console.log(`No records found in ${tableName}.`);
    }
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
  }
}

// Run the check
checkTables();