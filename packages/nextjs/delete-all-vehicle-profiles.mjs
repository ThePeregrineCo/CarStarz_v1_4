import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function deleteAllVehicleProfiles() {
  try {
    console.log('Deleting all vehicle profiles...');
    
    // First, check if the delete_all_vehicle_profiles function exists
    const { error: functionCheckError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'delete_all_vehicle_profiles')
      .maybeSingle();
    
    if (functionCheckError) {
      console.error('Error checking for function:', functionCheckError);
      console.log('Falling back to direct table deletion...');
      
      // Delete directly from tables
      console.log('Deleting from vehicle_media table...');
      const { error: mediaError } = await supabase
        .from('vehicle_media')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (mediaError) {
        console.error('Error deleting from vehicle_media:', mediaError);
      } else {
        console.log('Successfully deleted all records from vehicle_media');
      }
      
      console.log('Deleting from vehicle_videos table...');
      const { error: videosError } = await supabase
        .from('vehicle_videos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (videosError) {
        console.error('Error deleting from vehicle_videos:', videosError);
      } else {
        console.log('Successfully deleted all records from vehicle_videos');
      }
      
      console.log('Deleting from vehicle_profiles table...');
      const { error: profilesError } = await supabase
        .from('vehicle_profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (profilesError) {
        console.error('Error deleting from vehicle_profiles:', profilesError);
      } else {
        console.log('Successfully deleted all records from vehicle_profiles');
      }
      
      console.log('All vehicle profiles deleted successfully!');
      return;
    }
    
    // If the function exists, use it
    const { error } = await supabase.rpc('delete_all_vehicle_profiles');
    
    if (error) {
      console.error('Error deleting vehicle profiles:', error);
      return;
    }
    
    console.log('All vehicle profiles deleted successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
deleteAllVehicleProfiles();