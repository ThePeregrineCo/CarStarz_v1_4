// Script to check vehicle_links table in Supabase
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

async function checkVehicleLinks() {
  try {
    console.log('Checking vehicle_links table...');
    const { data, error, count } = await supabase
      .from('vehicle_links')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Error fetching vehicle links:', error);
      return;
    }

    console.log(`Found ${count} vehicle links`);
    
    if (data && data.length > 0) {
      console.log('First 3 links:');
      data.slice(0, 3).forEach(link => {
        console.log(`- ID: ${link.id}, Vehicle ID: ${link.vehicle_id}, Title: ${link.title}, URL: ${link.url}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVehicleLinks();