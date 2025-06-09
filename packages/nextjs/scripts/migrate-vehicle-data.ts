import { getSupabaseClient } from '../lib/supabase';

/**
 * Script to migrate vehicle data from the old schema to the new schema
 * This will copy all vehicles from the old schema to the new schema
 */
async function migrateVehicleData() {
  console.log('Starting vehicle data migration...');
  
  // Log environment variables for debugging (without showing full values)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'not set');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set (hidden)' : 'not set');
  
  const client = getSupabaseClient(true);
  if (!client) {
    console.error('Failed to get Supabase client');
    console.error('Please check your environment variables and try again');
    return;
  }
  
  try {
    // Step 1: Get all vehicles from the old schema
    console.log('Fetching vehicles from old schema...');
    const { data: oldVehicles, error: oldVehiclesError } = await client
      .from('vehicles')
      .select('*');
    
    if (oldVehiclesError) {
      throw new Error(`Error fetching old vehicles: ${oldVehiclesError.message}`);
    }
    
    console.log(`Found ${oldVehicles?.length || 0} vehicles in old schema`);
    
    if (!oldVehicles?.length) {
      console.log('No vehicles found in old schema. Nothing to migrate.');
      return;
    }
    
    // Step 2: For each old vehicle, check if it already exists in the new schema
    console.log('Checking for existing vehicles in new schema...');
    const tokenIds = oldVehicles.map(v => v.token_id);
    const { data: existingVehicles, error: existingVehiclesError } = await client
      .from('vehicle_profiles')
      .select('token_id')
      .in('token_id', tokenIds);
    
    if (existingVehiclesError) {
      throw new Error(`Error checking existing vehicles: ${existingVehiclesError.message}`);
    }
    
    const existingTokenIds = new Set(existingVehicles?.map(v => v.token_id) || []);
    console.log(`Found ${existingTokenIds.size} vehicles already in new schema`);
    
    // Step 3: Filter out vehicles that already exist in the new schema
    const vehiclesToMigrate = oldVehicles.filter(v => !existingTokenIds.has(v.token_id));
    console.log(`Migrating ${vehiclesToMigrate.length} vehicles...`);
    
    // Step 4: Prepare the data for insertion into the new schema
    const vehicleProfilesToInsert = vehiclesToMigrate.map(oldVehicle => ({
      token_id: oldVehicle.token_id,
      owner_wallet: oldVehicle.owner_address?.toLowerCase() || '',
      name: oldVehicle.name || null,
      description: oldVehicle.description || null,
      make: oldVehicle.make || 'Unknown',
      model: oldVehicle.model || 'Unknown',
      year: oldVehicle.year || 0,
      vin: oldVehicle.vin || null,
      primary_image_url: oldVehicle.image_url || null,
    }));
    
    // Step 5: Insert the vehicles into the new schema
    if (vehicleProfilesToInsert.length > 0) {
      console.log('Inserting vehicles into new schema...');
      const { data: insertedVehicles, error: insertError } = await client
        .from('vehicle_profiles')
        .insert(vehicleProfilesToInsert)
        .select();
      
      if (insertError) {
        throw new Error(`Error inserting vehicles: ${insertError.message}`);
      }
      
      console.log(`Successfully inserted ${insertedVehicles?.length || 0} vehicles into new schema`);
      
      // Log the token IDs of the inserted vehicles
      insertedVehicles?.forEach(vehicle => {
        console.log(`- Vehicle ${vehicle.token_id}: ${vehicle.make} ${vehicle.model} (${vehicle.year})`);
      });
    } else {
      console.log('No vehicles to insert. All vehicles already exist in new schema.');
    }
    
    // Step 6: Migrate related data (media, specifications, links, etc.)
    console.log('Migrating related data...');
    
    // Step 6.1: Migrate media
    console.log('Migrating media...');
    for (const oldVehicle of vehiclesToMigrate) {
      // Get the vehicle ID from the new schema
      const { data: newVehicle } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', oldVehicle.token_id)
        .single();
      
      if (!newVehicle) {
        console.warn(`Could not find new vehicle for token ID ${oldVehicle.token_id}. Skipping media migration.`);
        continue;
      }
      
      // Get media from old schema
      const { data: oldMedia } = await client
        .from('vehicle_media')
        .select('*')
        .eq('vehicle_id', oldVehicle.id);
      
      if (oldMedia?.length) {
        console.log(`Migrating ${oldMedia.length} media items for vehicle ${oldVehicle.token_id}...`);
        
        // Prepare media for insertion
        const mediaToInsert = oldMedia.map(media => ({
          vehicle_id: newVehicle.id,
          url: media.url,
          type: media.type,
          caption: media.caption,
          category: media.category,
          is_featured: media.is_featured || false,
          metadata: media.metadata || {},
        }));
        
        // Insert media
        const { error: mediaInsertError } = await client
          .from('vehicle_media')
          .insert(mediaToInsert);
        
        if (mediaInsertError) {
          console.error(`Error inserting media for vehicle ${oldVehicle.token_id}:`, mediaInsertError);
        }
      }
      
      // Get specifications from old schema
      const { data: oldSpecs } = await client
        .from('vehicle_specifications')
        .select('*')
        .eq('vehicle_id', oldVehicle.id);
      
      if (oldSpecs?.length) {
        console.log(`Migrating ${oldSpecs.length} specifications for vehicle ${oldVehicle.token_id}...`);
        
        // Prepare specifications for insertion
        const specsToInsert = oldSpecs.map(spec => ({
          vehicle_id: newVehicle.id,
          category: spec.category,
          name: spec.name,
          value: spec.value,
        }));
        
        // Insert specifications
        const { error: specsInsertError } = await client
          .from('vehicle_specifications')
          .insert(specsToInsert);
        
        if (specsInsertError) {
          console.error(`Error inserting specifications for vehicle ${oldVehicle.token_id}:`, specsInsertError);
        }
      }
      
      // Get links from old schema
      const { data: oldLinks } = await client
        .from('vehicle_links')
        .select('*')
        .eq('vehicle_id', oldVehicle.id);
      
      if (oldLinks?.length) {
        console.log(`Migrating ${oldLinks.length} links for vehicle ${oldVehicle.token_id}...`);
        
        // Prepare links for insertion
        const linksToInsert = oldLinks.map(link => ({
          vehicle_id: newVehicle.id,
          title: link.title,
          url: link.url,
          type: link.type,
          icon: link.icon,
        }));
        
        // Insert links
        const { error: linksInsertError } = await client
          .from('vehicle_links')
          .insert(linksToInsert);
        
        if (linksInsertError) {
          console.error(`Error inserting links for vehicle ${oldVehicle.token_id}:`, linksInsertError);
        }
      }
      
      // Get modifications from old schema
      const { data: oldMods } = await client
        .from('vehicle_modifications')
        .select('*')
        .eq('vehicle_id', oldVehicle.id);
      
      if (oldMods?.length) {
        console.log(`Migrating ${oldMods.length} modifications for vehicle ${oldVehicle.token_id}...`);
        
        // Prepare modifications for insertion as parts
        const partsToInsert = oldMods.map(mod => ({
          vehicle_id: newVehicle.id,
          category: mod.category || 'Other',
          description: `${mod.name}: ${mod.description}`,
          link: null,
        }));
        
        // Insert parts
        const { error: partsInsertError } = await client
          .from('parts')
          .insert(partsToInsert);
        
        if (partsInsertError) {
          console.error(`Error inserting parts for vehicle ${oldVehicle.token_id}:`, partsInsertError);
        }
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration function
migrateVehicleData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });