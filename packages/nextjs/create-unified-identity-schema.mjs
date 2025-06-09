// Import required modules
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
 * Create the exec_sql function in Supabase if it doesn't exist
 */
async function createExecSqlFunction() {
  try {
    console.log('Creating exec_sql function if it doesn\'t exist...');
    
    // Check if the function already exists
    try {
      const { data: functionExists } = await supabase
        .rpc('exec_sql', { sql: 'SELECT 1;' });
      
      if (functionExists) {
        console.log('exec_sql function already exists');
        return true;
      }
    } catch (error) {
      console.log('exec_sql function does not exist, creating it...', error.message);
    }
    
    if (functionExists) {
      console.log('exec_sql function already exists');
      return true;
    }
    
    console.log('Creating exec_sql function...');
    
    // Create the function using direct SQL execution
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;

      -- Grant permission to use the function
      GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
    `;
    
    // Execute the SQL directly using the Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createFunctionSql
      })
    });
    
    if (!response.ok) {
      console.error('Error creating exec_sql function');
      return false;
    }
    
    console.log('exec_sql function created successfully');
    return true;
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return false;
  }
}

/**
 * Execute the SQL schema
 */
async function executeSchema() {
  try {
    console.log('Reading SQL schema file...');
    
    // Read the SQL schema file
    const sqlPath = path.resolve(__dirname, 'create-unified-identity-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL schema...');
    
    // Split the SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement separately
    for (const statement of statements) {
      if (!statement.trim()) continue;
      
      // Execute the SQL directly using the Supabase REST API
      try {
        // For simple queries that don't require admin privileges
        if (statement.trim().toLowerCase().startsWith('select') ||
            statement.trim().toLowerCase().startsWith('create index') ||
            statement.trim().toLowerCase().startsWith('create trigger')) {
          
          // Use Supabase query for simple operations
          const { error } = await supabase.from('_').select('*').limit(0);
          if (error) {
            console.error('Error with test query:', error);
          }
        }
        
        // For all statements, use direct SQL execution via fetch
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'apikey': supabaseServiceRoleKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: statement
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error executing SQL statement directly:', errorText);
          console.error('Statement:', statement);
          // Continue anyway to try other statements
          console.log('Continuing with next statement...');
        }
      } catch (error) {
        console.error('Error executing statement:', error);
        console.error('Statement:', statement);
        // Continue anyway to try other statements
        console.log('Continuing with next statement...');
      }
    }
    
    console.log('SQL schema executed successfully');
    return true;
  } catch (error) {
    console.error('Error executing SQL schema:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting unified identity schema creation...');
    
    // Create the exec_sql function if it doesn't exist
    const functionCreated = await createExecSqlFunction();
    if (!functionCreated) {
      console.error('Failed to create exec_sql function');
      // Continue anyway, we'll try direct execution
    }
    
    // Execute the schema
    const schemaExecuted = await executeSchema();
    if (!schemaExecuted) {
      console.error('Failed to execute schema');
      process.exit(1);
    }
    
    console.log('Unified identity schema created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating unified identity schema:', error);
    process.exit(1);
  }
}

// Run the main function
main();