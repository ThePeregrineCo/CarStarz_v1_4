/**
 * Add Vehicle Videos Table Script
 *
 * This script adds the vehicle_videos table to the Supabase database
 * using the Supabase REST API directly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the SQL content
const sqlFilePath = path.join(__dirname, 'add-vehicle-videos-table.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment');
  process.exit(1);
}

async function addVehicleVideosTable() {
  console.log('=== Adding vehicle_videos table to Supabase ===');
  console.log('This script will add the vehicle_videos table to your Supabase database');
  console.log();

  try {
    // Execute the SQL using the REST API
    console.log('Executing SQL via REST API...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error executing SQL:', errorText);
      process.exit(1);
    }
    
    console.log('✅ vehicle_videos table has been successfully added to your database!');
    console.log('You can now use the vehicleQueriesV2 methods to work with YouTube videos.');
    console.log();
    console.log('To verify the table was created, check your Supabase dashboard.');
    console.log('You can also test the API by adding a YouTube video using:');
    console.log('POST /api/vehicle-videos with JSON body: { title: \'My Video\', youtube_url: \'https://youtube.com/watch?v=...\' }');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Run the function
addVehicleVideosTable();