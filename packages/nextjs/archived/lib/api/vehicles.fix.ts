// This is a fixed version of the logAction function to address the schema mismatch
import { getSupabaseClient } from '../supabase';

// Helper function to get Supabase client
function getClient(useServiceRole = false) {
  return getSupabaseClient(useServiceRole);
}

// Fix for the logAction function
export async function fixedLogAction(tokenId: string | number, action: string, details: string, userWallet?: string) {
  try {
    const client = getClient();
    
    if (!client) {
      console.error('Supabase client not available - missing environment variables');
      return null;
    }
    
    // First, get the vehicle_id (UUID) from the token_id
    const { data: vehicle, error: vehicleError } = await client
      .from('vehicle_profiles')
      .select('id')
      .eq('token_id', tokenId)
      .maybeSingle();
    
    if (vehicleError) {
      console.error(`Error finding vehicle with token ID ${tokenId}:`, vehicleError);
      return null;
    }
    
    if (!vehicle) {
      console.error(`No vehicle found with token ID ${tokenId}`);
      return null;
    }
    
    // Now use the vehicle_id (UUID) for the audit log
    // Store user_wallet within the details JSONB field instead of as a separate column
    const detailsJson = {
      content: details,
      user_wallet: userWallet || 'system'
    };
    
    const { data, error } = await client
      .from('vehicle_audit_log')
      .insert([
        {
          vehicle_id: vehicle.id, // Use the UUID instead of token_id
          action,
          details: detailsJson,
        },
      ])
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error inserting audit log:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error logging action:', error);
    // Don't throw here, just log the error
    return null;
  }
}

// Fix for the getByTokenId function to handle missing environment variables
export async function fixedGetByTokenId(tokenId: string) {
  try {
    const client = getClient();
    
    if (!client) {
      console.error('Supabase client not available - missing environment variables');
      return null;
    }
    
    const { data, error } = await client
      .from('vehicle_profiles')
      .select(`
        *,
        vehicle_modifications(*),
        vehicle_media(*),
        vehicle_links(*),
        vehicle_specifications(*),
        vehicle_comments(*)
      `)
      .eq('token_id', tokenId)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching vehicle profile for token ID ${tokenId}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching vehicle profile for token ID ${tokenId}:`, error);
    return null;
  }
}

/*
To implement these fixes:

1. Replace the logAction function in vehicles.ts with the fixedLogAction function above
2. Replace the getByTokenId function in vehicles.ts with the fixedGetByTokenId function above

These fixes address:
- The audit log schema mismatch by getting the vehicle_id (UUID) from the token_id
- Better error handling for missing environment variables
*/