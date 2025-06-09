// Script to reset the complete database schema including identity registry
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

async function resetDatabase() {
  try {
    console.log('Reading complete reset SQL file...');
    const sqlFilePath = path.join(__dirname, 'complete-reset-script.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL to reset database schema with identity registry...');
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }

    console.log('Complete database schema reset successfully!');
    console.log('This includes both vehicle tables AND identity registry tables.');
    
    // Reset token counter
    try {
      console.log('Resetting token counter...');
      const tokenCounterPath = path.join(__dirname, 'data', 'tokenCounter.json');
      const tokenCounterData = JSON.stringify({ default: 1 }, null, 2);
      
      // Ensure the data directory exists
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(tokenCounterPath, tokenCounterData);
      console.log('Token counter reset to 1');
    } catch (tokenError) {
      console.error('Error resetting token counter:', tokenError);
    }
    
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Execute the function
resetDatabase();