// Script to reset the CARSTARZ database schema using direct SQL execution
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Initialize dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function resetDatabase() {
  try {
    console.log('Reading SQL file...');
    const sqlFilePath = path.join(__dirname, 'reset-schema-carstarz.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the SQL statement using the REST API
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' }).catch(err => {
          return { error: err };
        });
        
        if (error) {
          console.warn(`Warning: Error executing statement ${i + 1}: ${error.message}`);
          console.warn('Continuing with next statement...');
        } else {
          console.log(`Statement ${i + 1} executed successfully.`);
        }
      } catch (error) {
        console.warn(`Warning: Error executing statement ${i + 1}: ${error.message}`);
        console.warn('Continuing with next statement...');
      }
    }

    console.log('Database schema reset completed.');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Execute the function
resetDatabase();