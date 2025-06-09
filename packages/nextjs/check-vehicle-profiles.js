// Script to check vehicle_profiles table in Supabase
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkVehicleProfiles() {
  try {
    console.log('Checking vehicle_profiles table...');
    const { data, error, count } = await supabase
      .from('vehicle_profiles')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Error fetching vehicle profiles:', error);
      return;
    }

    console.log(`Found ${count} vehicle profiles`);
    
    if (data && data.length > 0) {
      console.log('First 3 profiles:');
      data.slice(0, 3).forEach(profile => {
        console.log(`- ID: ${profile.id}, Token ID: ${profile.token_id}, Make: ${profile.make}, Model: ${profile.model}, Year: ${profile.year}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVehicleProfiles();