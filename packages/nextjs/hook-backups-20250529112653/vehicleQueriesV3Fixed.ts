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
  user_id: string | null;
  ens_name: string | null;
  did: string | null;
  last_login: string;
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

export const vehicleQueriesV3Fixed = {
  // Get a complete vehicle profile with all relationships
  async getCompleteProfile(tokenId: string): Promise<CompleteVehicleProfile | null> {
    try {
      const client = getClient();
      
      // Get the vehicle profile
      const { data: vehicle, error } = await client
        .from('vehicle_profiles')
        .select(`
          *,
          vehicle_media(*),
          vehicle_specifications(*),
          vehicle_links(*),
          vehicle_videos(*)
        `)
        .eq('token_id', tokenId)
        .single();
      
      if (error) throw error;
      if (!vehicle) return null;
      
      // Get owner information separately
      let owner = null;
      if (vehicle.owner_wallet) {
        const { data: ownerData } = await client
          .from('identity_registry')
          .select('*')
          .eq('normalized_wallet', vehicle.owner_wallet.toLowerCase())
          .maybeSingle();
        
        owner = ownerData;
      }
      
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
        owner: owner || undefined,
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
      
      // First, get the vehicle profiles
      let query = client
        .from('vehicle_profiles')
        .select(`
          *,
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
      
      // If no vehicles found, return empty array
      if (!data || data.length === 0) {
        return [];
      }
      
      // Get all unique owner wallet addresses
      const ownerWallets = [...new Set(data.map(v => v.owner_wallet?.toLowerCase()))].filter(Boolean);
      
      // Get owner information for all vehicles in a single query
      let owners: Record<string, User> = {};
      if (ownerWallets.length > 0) {
        const { data: ownersData } = await client
          .from('identity_registry')
          .select('*')
          .in('normalized_wallet', ownerWallets);
        
        if (ownersData) {
          // Create a map of wallet address to owner data
          owners = ownersData.reduce((acc, owner) => {
            if (owner.normalized_wallet) {
              acc[owner.normalized_wallet] = owner;
            }
            return acc;
          }, {} as Record<string, User>);
        }
      }
      
      // Combine vehicle data with owner data
      const completeVehicles = data.map(vehicle => {
        const ownerWallet = vehicle.owner_wallet?.toLowerCase();
        return {
          ...vehicle,
          owner: ownerWallet ? owners[ownerWallet] : undefined
        };
      });
      
      if (completeVehicles.length > 0) {
        console.log("[DEBUG QUERY] First vehicle:", JSON.stringify(completeVehicles[0], null, 2));
      }
      
      return completeVehicles as CompleteVehicleProfile[];
    } catch (error) {
      console.error('Error searching vehicles:', error);
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

// Export the fixed queries as the default implementation
export default vehicleQueriesV3Fixed;