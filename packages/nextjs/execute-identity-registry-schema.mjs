// Script to directly execute the identity registry schema SQL
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

async function executeIdentityRegistrySchema() {
  console.log('=== Executing Identity Registry Schema SQL ===');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'identity-registry-schema-simplified.sql');
    console.log(`Reading SQL file: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim() + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('');
    console.log('=== Identity Registry Schema Execution Complete ===');
    
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
      console.log('All identity registry tables were created successfully!');
    } else {
      console.log('');
      console.log('Some tables may not have been created correctly.');
      console.log('Please check the logs above for details.');
    }
  } catch (error) {
    console.error('Error executing identity registry schema:', error);
  }
}

// Execute the function
executeIdentityRegistrySchema();