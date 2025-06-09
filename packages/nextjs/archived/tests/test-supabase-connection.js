// Test script to verify Supabase connection and database operations
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Log environment variables (without revealing full values)
console.log('Environment variables check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Not set ✗');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✓' : 'Not set ✗');

// Create Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabaseConnection() {
  console.log('\n--- Testing Supabase Connection ---');
  
  try {
    // 1. Test basic connection by querying the vehicle_profiles table
    console.log('1. Testing connection by querying vehicle_profiles table...');
    const { data: existingProfiles, error: queryError } = await supabase
      .from('vehicle_profiles')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.error('Error querying vehicle_profiles:', queryError);
    } else {
      console.log(`Successfully queried vehicle_profiles. Found ${existingProfiles.length} records.`);
      if (existingProfiles.length > 0) {
        console.log('First record:', existingProfiles[0]);
      }
    }
    
    // 2. Insert a test record
    console.log('\n2. Inserting a test vehicle profile...');
    const testVehicle = {
      token_id: 9999,  // Using a high number to avoid conflicts
      vin: `TEST${Date.now()}`,  // Unique VIN to avoid conflicts
      make: 'Test',
      model: 'TestModel',
      year: 2023,
      name: 'Test Vehicle',
      description: 'This is a test vehicle created by the test script',
      owner_wallet: '0x0000000000000000000000000000000000000000'
    };
    
    const { data: insertedVehicle, error: insertError } = await supabase
      .from('vehicle_profiles')
      .insert([testVehicle])
      .select();
    
    if (insertError) {
      console.error('Error inserting test vehicle:', insertError);
    } else {
      console.log('Successfully inserted test vehicle:', insertedVehicle);
    }
    
    // 3. Query the specific record we just inserted
    if (!insertError) {
      console.log('\n3. Verifying the test vehicle was inserted...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('vehicle_profiles')
        .select('*')
        .eq('token_id', 9999)
        .single();
      
      if (verifyError) {
        console.error('Error verifying test vehicle:', verifyError);
      } else {
        console.log('Successfully verified test vehicle exists:', verifyData);
      }
    }
    
    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies on vehicle_profiles table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'vehicle_profiles' });
    
    if (policiesError) {
      console.error('Error checking RLS policies:', policiesError);
      console.log('Note: The get_policies_for_table function might not exist in your database.');
      console.log('You can check policies in the Supabase dashboard under Authentication > Policies.');
    } else {
      console.log('RLS Policies:', policies);
    }
    
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }
}

testSupabaseConnection();