#!/bin/bash

# Exit on error
set -e

echo "=== CarStarz V2 Clean Migration ==="
echo "This script will reset the database and set up the app to use only V2 components"
echo "WARNING: This will delete all existing data in the database"
echo

# Confirm with the user
read -p "Are you sure you want to proceed? This will delete all existing data. (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local"
  export $(grep -v '^#' .env.local | xargs)
fi

# Always set SUPABASE_URL from NEXT_PUBLIC_SUPABASE_URL for the script
export SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
echo "Using SUPABASE_URL: ${SUPABASE_URL}"

# Check if NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
  echo "Please check your .env.local file and try again"
  exit 1
fi

echo "Step 1: Resetting the database..."
# Drop old schema tables
echo "Dropping old schema tables..."
npx ts-node -e "
const { getSupabaseClient } = require('./lib/supabase');
async function dropOldSchemaTables() {
  const client = getSupabaseClient(true);
  if (!client) {
    console.error('Failed to get Supabase client');
    process.exit(1);
  }
  
  // Drop old tables if they exist
  const oldTables = [
    'vehicles',
    'vehicle_media_old',
    'vehicle_modifications_old',
    'vehicle_links_old',
    'vehicle_specifications_old',
    'vehicle_comments_old',
    'vehicle_videos_old',
    'vehicle_audit_log_old'
  ];
  
  for (const table of oldTables) {
    try {
      console.log(\`Dropping table \${table} if it exists...\`);
      await client.rpc('drop_table_if_exists', { table_name: table });
      console.log(\`Table \${table} dropped or did not exist.\`);
    } catch (error) {
      console.error(\`Error dropping table \${table}:\`, error);
    }
  }
  
  console.log('Old schema tables dropped or did not exist.');
}

dropOldSchemaTables().catch(console.error);
"

# Create new schema tables
echo "Creating new schema tables..."
npx supabase-js-cli db execute --file ./schema-profile-updates-safe.sql

echo "Step 2: Updating code to use only V2 components..."

# Update the Community page API to use V2 queries
echo "Updating Community page API..."
cat > ./app/api/vehicles/route.ts << 'EOL'
import { NextResponse } from "next/server";
import { vehicleQueriesV2 } from "../../../lib/api/vehicleQueriesV2";

export async function GET() {
  try {
    console.log("[DEBUG API] GET /api/vehicles - Fetching all vehicles from Supabase");
    
    // Get all vehicles using the V2 queries
    const vehicles = await vehicleQueriesV2.searchVehicles({});
    console.log(`[DEBUG API] Found ${vehicles.length} vehicles in Supabase`);
    
    // Transform the data to include image paths and format consistently
    const formattedVehicles = vehicles.map((vehicle) => {
      // Find image from media if available
      let imagePath = null;
      if (vehicle.vehicle_media && vehicle.vehicle_media.length > 0) {
        // Try to find a featured image first
        const featuredImage = vehicle.vehicle_media.find((media: any) => media.is_featured);
        if (featuredImage) {
          imagePath = featuredImage.url;
        } else if (vehicle.vehicle_media[0]) {
          // Otherwise use the first image
          imagePath = vehicle.vehicle_media[0].url;
        }
      }
      
      // If no image found in media, use a fallback based on token ID
      if (!imagePath && vehicle.token_id) {
        imagePath = `/metadata/${vehicle.token_id}.jpg`;
      } else if (!imagePath) {
        // Default fallback image if no token_id
        imagePath = `/images/vehicle-placeholder.jpg`;
      }
      
      return {
        tokenId: vehicle.token_id,
        vin: vehicle.vin,
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        description: vehicle.description,
        owner: vehicle.owner_wallet,
        image: imagePath,
        source: 'supabase'
      };
    });
    
    return NextResponse.json(formattedVehicles);
  } catch (error) {
    console.error("Error loading vehicles:", error);
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 });
  }
}
EOL

# Update the minting process to use V2 queries
echo "Updating minting process..."
cat > ./app/api/mint/route.ts << 'EOL'
import { NextResponse } from "next/server";
import { vehicleQueriesV2 } from "../../../lib/api/vehicleQueriesV2";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { tokenId, owner, metadata } = data;
    
    console.log(`Minting vehicle with token ID ${tokenId} for owner ${owner}`);
    console.log('Metadata:', metadata);
    
    // Create vehicle in the V2 schema
    const vehicle = await vehicleQueriesV2.createVehicle({
      token_id: tokenId,
      owner_wallet: owner,
      name: metadata.name || null,
      description: metadata.description || null,
      make: metadata.make || 'Unknown',
      model: metadata.model || 'Unknown',
      year: metadata.year || 0,
      vin: metadata.vin || null,
      primary_image_url: metadata.image || null
    });
    
    console.log('Vehicle created successfully:', vehicle);
    
    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("Error minting vehicle:", error);
    return NextResponse.json({ 
      error: "Failed to mint vehicle", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
EOL

# Add createVehicle method to vehicleQueriesV2.ts if it doesn't exist
echo "Updating vehicleQueriesV2.ts..."
cat >> ./lib/api/vehicleQueriesV2.ts << 'EOL'

  // Create a new vehicle
  async createVehicle(data: {
    token_id: string | number;
    owner_wallet: string;
    name?: string | null;
    description?: string | null;
    make?: string;
    model?: string;
    year?: number;
    vin?: string | null;
    primary_image_url?: string | null;
  }): Promise<CompleteVehicleProfile> {
    try {
      const client = getClient(true); // Use service role for writes
      
      // Prepare the data
      const vehicleData = {
        token_id: data.token_id.toString(),
        owner_wallet: data.owner_wallet.toLowerCase(),
        name: data.name || null,
        description: data.description || null,
        make: data.make || 'Unknown',
        model: data.model || 'Unknown',
        year: data.year || 0,
        vin: data.vin || null,
        primary_image_url: data.primary_image_url || null,
      };
      
      // Insert the vehicle
      const { data: newVehicle, error } = await client
        .from('vehicle_profiles')
        .insert(vehicleData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Return the new vehicle
      return this.getCompleteProfile(newVehicle.token_id) as Promise<CompleteVehicleProfile>;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },
EOL

echo "Step 3: Seeding test businesses..."
# Run the seed businesses script
./run-seed-businesses.sh

echo
echo "=== Migration Complete ==="
echo "The app is now set up to use only V2 components with a clean database."
echo "You can now restart your development server and test the app."