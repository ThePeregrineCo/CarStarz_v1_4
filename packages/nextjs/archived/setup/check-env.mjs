// Simple script to check if environment variables are being loaded properly
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '.env.local') });

console.log('Loaded environment from:', join(__dirname, '.env.local'));
import { createClient } from '@supabase/supabase-js';

console.log('Environment variables check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Not set ✗');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✓' : 'Not set ✗');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✓' : 'Not set ✗');

// Try to create a Supabase client
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\nTrying to connect to Supabase...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test the connection by querying the vehicle_profiles table
  async function testConnection() {
    try {
      const { data, error } = await supabase
        .from('vehicle_profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error connecting to Supabase:', error);
      } else {
        console.log('Successfully connected to Supabase!');
        console.log(`Found ${data.length} records in vehicle_profiles table.`);
        if (data.length > 0) {
          console.log('First record:', data[0]);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }
  
  testConnection();
} else {
  console.log('\nCannot connect to Supabase: Missing environment variables.');
}