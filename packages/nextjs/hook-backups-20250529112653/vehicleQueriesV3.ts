import { getSupabaseClient } from '../supabase';

// Type definitions for the new schema
export interface Builder {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  contact_info: any;
  subscription_tier: string;
  specialties: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BuilderVehicle {
  id: string;
  builder_id: string;
  vehicle_id: string;
  work_type: string;
  build_description: string;
  build_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  vehicle_id: string;
  category: string;
  description: string;
  link: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleMedia {
  id: string;
  vehicle_id: string;
  url: string;
  type: 'image' | 'video';
  caption: string | null;
  category: string | null;
  is_featured: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface VehicleSpecification {
  id: string;
  vehicle_id: string;
  category: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleLink {
  id: string;
  vehicle_id: string;
  title: string;
  url: string;
  type: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

// Updated User interface to match identity_registry
export interface User {
  id: string;
  wallet_address: string;
  normalized_wallet: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  banner_image_url: string | null;
  email: string | null;
  ens_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleProfile {
  id: string;
  token_id: string;
  owner_wallet: string;
  name: string | null;
  description: string | null;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  primary_image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Complete vehicle profile with all relationships
export interface CompleteVehicleProfile extends VehicleProfile {
  owner?: User;
  vehicle_media?: VehicleMedia[];
  vehicle_specifications?: VehicleSpecification[];
  vehicle_links?: VehicleLink[];
  vehicle_videos?: VehicleVideo[];
  parts?: Part[];
  builders?: Array<Builder & Partial<BuilderVehicle>>;
}

// Define interface for vehicle videos
export interface VehicleVideo {
  id: string;
  vehicle_id: string;
  title: string;
  youtube_url: string;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

// Define interface for audit log entries
export interface AuditLogEntry {
  id: string;
  vehicle_id: string;
  action: string;
  details: {
    content: string;
    user_wallet: string;
  };
  created_at: string;
  updated_at: string;
}

// Define interface for comments
export interface VehicleComment {
  id: string;
  vehicle_id: string;
  user_wallet: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Helper function to get Supabase client
function getClient(useServiceRole = true) {
  console.log(`[DEBUG CLIENT] Getting Supabase client with useServiceRole=${useServiceRole}`);
  const client = getSupabaseClient(useServiceRole);
  if (!client) {
    console.error('[DEBUG CLIENT] Failed to get Supabase client. Check your environment variables.');
    throw new Error('Failed to get Supabase client. Check your environment variables.');
  }
  console.log('[DEBUG CLIENT] Successfully got Supabase client');
  return client;
}

export const vehicleQueriesV3 = {
  // Get a complete vehicle profile with all relationships
  async getCompleteProfile(tokenId: string): Promise<CompleteVehicleProfile | null> {
    try {
      const client = getClient();
      
      // Get the vehicle profile
      const { data: vehicle, error } = await client
        .from('vehicle_profiles')
        .select(`
          *,
          owner:identity_registry!owner_wallet(id, wallet_address, normalized_wallet, username, display_name, profile_image_url),
          vehicle_media(*),
          vehicle_specifications(*),
          vehicle_links(*),
          vehicle_videos(*)
        `)
        .eq('token_id', tokenId)
        .single();
      
      if (error) throw error;
      if (!vehicle) return null;
      
      // Get parts
      const { data: parts } = await client
        .from('parts')
        .select('*')
        .eq('vehicle_id', vehicle.id);
      
      // Get builders with relationship data
      const { data: builderRelationships } = await client
        .from('builder_vehicles')
        .select(`
          *,
          builder:businesses(*)
        `)
        .eq('token_id', vehicle.token_id);
      
      // Transform builder data to include relationship fields
      const builders = builderRelationships?.map(rel => ({
        ...rel.builder,
        work_type: rel.work_type,
        build_description: rel.build_description,
        build_date: rel.build_date,
      }));
      
      // Combine all data
      return {
        ...vehicle,
        parts: parts || [],
        builders: builders || [],
      } as CompleteVehicleProfile;
    } catch (error) {
      console.error('Error fetching complete vehicle profile:', error);
      return null;
    }
  },
  
  // Search for vehicles with filters
  async searchVehicles(params: {
    make?: string;
    model?: string;
    year?: number;
    username?: string;
    builder?: string;
    owner_wallet?: string;
    limit?: number;
    offset?: number;
  }): Promise<CompleteVehicleProfile[]> {
    try {
      const client = getClient();
      let query = client
        .from('vehicle_profiles')
        .select(`
          *,
          owner:identity_registry!owner_wallet(id, wallet_address, normalized_wallet, username, display_name, profile_image_url),
          vehicle_media(*),
          vehicle_videos(*),
          vehicle_specifications(*),
          vehicle_links(*)
        `);
      
      // Apply filters
      if (params.make) query = query.ilike('make', `%${params.make}%`);
      if (params.model) query = query.ilike('model', `%${params.model}%`);
      if (params.year) query = query.eq('year', params.year);
      if (params.owner_wallet) {
        // Always ensure wallet addresses are lowercase for consistent querying
        const normalizedWallet = params.owner_wallet.toLowerCase();
        console.log(`[DEBUG QUERY] Filtering by normalized owner wallet: ${normalizedWallet}`);
        query = query.eq('owner_wallet', normalizedWallet);
      }
      
      // Apply pagination
      if (params.limit) query = query.limit(params.limit);
      if (params.offset) query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      
      // Execute query
      console.log("[DEBUG QUERY] Executing searchVehicles query with params:", JSON.stringify(params));
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("[DEBUG QUERY] Error in searchVehicles:", error);
        throw error;
      }
      
      console.log(`[DEBUG QUERY] searchVehicles found ${data?.length || 0} vehicles`);
      if (data && data.length > 0) {
        console.log("[DEBUG QUERY] First vehicle:", JSON.stringify(data[0], null, 2));
      }
      
      return data as CompleteVehicleProfile[];
    } catch (error) {
      console.error('Error searching vehicles:', error);
      return [];
    }
  },
  
  // Get vehicles by builder
  async getVehiclesByBuilder(builderId: string): Promise<CompleteVehicleProfile[]> {
    try {
      const client = getClient();
      
      // Get vehicle token IDs associated with this builder
      const { data: relationships, error } = await client
        .from('builder_vehicles')
        .select('token_id')
        .eq('business_id', builderId);
      
      if (error) throw error;
      if (!relationships?.length) return [];
      
      // Get the vehicle profiles
      const tokenIds = relationships.map(rel => rel.token_id);
      const { data: vehicles } = await client
        .from('vehicle_profiles')
        .select(`
          *,
          owner:identity_registry!owner_wallet(id, wallet_address, normalized_wallet, username, display_name, profile_image_url),
          vehicle_media(*),
          vehicle_videos(*),
          vehicle_specifications(*),
          vehicle_links(*)
        `)
        .in('token_id', tokenIds);
      
      return vehicles as CompleteVehicleProfile[] || [];
    } catch (error) {
      console.error('Error fetching vehicles by builder:', error);
      return [];
    }
  },
  
  // Get recent vehicles with featured media
  async getRecentVehiclesWithFeaturedMedia(limit: number = 10): Promise<CompleteVehicleProfile[]> {
    try {
      const client = getClient();
      
      const { data, error } = await client
        .from('vehicle_profiles')
        .select(`
          *,
          owner:identity_registry!owner_wallet(id, wallet_address, normalized_wallet, username, display_name, profile_image_url),
          vehicle_media(*),
          vehicle_videos(*),
          vehicle_specifications(*),
          vehicle_links(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as CompleteVehicleProfile[] || [];
    } catch (error) {
      console.error('Error fetching recent vehicles:', error);
      return [];
    }
  },
  
  // Update vehicle profile
  async updateVehicleProfile(tokenId: string, data: Partial<CompleteVehicleProfile>): Promise<boolean> {
    try {
      const client = getClient(true); // Use service role for updates
      
      // Extract only the fields that belong to the vehicle_profiles table
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_media,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_specifications,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_links,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        parts,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        builders,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        owner,
        ...vehicleData
      } = data;
      
      // Update the vehicle profile
      const { error } = await client
        .from('vehicle_profiles')
        .update(vehicleData)
        .eq('token_id', tokenId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating vehicle profile:', error);
      throw error;
    }
  },
  
  // Create a new vehicle profile
  async createVehicleProfile(tokenId: string, data: Partial<CompleteVehicleProfile>): Promise<VehicleProfile | null> {
    try {
      const client = getClient(true); // Use service role for creation
      
      // Extract only the fields that belong to the vehicle_profiles table
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_media,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_specifications,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_links,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        parts,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        builders,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        owner,
        ...vehicleData
      } = data;
      
      // Insert the new vehicle profile
      const { data: newProfile, error } = await client
        .from('vehicle_profiles')
        .insert([{ token_id: tokenId, ...vehicleData }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Return the newly created profile
      return newProfile as VehicleProfile;
    } catch (error) {
      console.error('Error creating vehicle profile:', error);
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }
};

// Export the V3 queries as the default implementation
export default vehicleQueriesV3;