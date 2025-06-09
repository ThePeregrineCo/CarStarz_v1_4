import { getSupabaseClient } from '../supabase';

// Type definitions for the unified schema
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
  image_url?: string | null;
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
  user_id: string | null;
  did: string | null;
  last_login: string | null;
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
  vehicle_media?: VehicleMedia[];
  vehicle_videos?: VehicleVideo[];
  vehicle_specifications?: VehicleSpecification[];
  vehicle_links?: VehicleLink[];
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

export const vehicleQueries = {
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
      
      // Get owner information from identity_registry
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
      
      // Get owner information for each vehicle
      const vehiclesWithOwners = await Promise.all((data || []).map(async (vehicle) => {
        if (vehicle.owner_wallet) {
          const { data: ownerData } = await client
            .from('identity_registry')
            .select('*')
            .eq('normalized_wallet', vehicle.owner_wallet.toLowerCase())
            .maybeSingle();
          
          return {
            ...vehicle,
            owner: ownerData || undefined
          };
        }
        return vehicle;
      }));
      
      return vehiclesWithOwners as CompleteVehicleProfile[];
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
          vehicle_media(*),
          vehicle_videos(*),
          vehicle_specifications(*),
          vehicle_links(*)
        `)
        .in('token_id', tokenIds);
      
      // Get owner information for each vehicle
      const vehiclesWithOwners = await Promise.all((vehicles || []).map(async (vehicle) => {
        if (vehicle.owner_wallet) {
          const { data: ownerData } = await client
            .from('identity_registry')
            .select('*')
            .eq('normalized_wallet', vehicle.owner_wallet.toLowerCase())
            .maybeSingle();
          
          return {
            ...vehicle,
            owner: ownerData || undefined
          };
        }
        return vehicle;
      }));
      
      return vehiclesWithOwners as CompleteVehicleProfile[] || [];
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
          vehicle_media(*),
          vehicle_videos(*),
          vehicle_specifications(*),
          vehicle_links(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Get owner information for each vehicle
      const vehiclesWithOwners = await Promise.all((data || []).map(async (vehicle) => {
        if (vehicle.owner_wallet) {
          const { data: ownerData } = await client
            .from('identity_registry')
            .select('*')
            .eq('normalized_wallet', vehicle.owner_wallet.toLowerCase())
            .maybeSingle();
          
          return {
            ...vehicle,
            owner: ownerData || undefined
          };
        }
        return vehicle;
      }));
      
      return vehiclesWithOwners as CompleteVehicleProfile[] || [];
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
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  // Vehicle Media Methods
  
  /**
   * Add media to a vehicle
   * @param tokenId The token ID of the vehicle
   * @param formData Form data containing the file and metadata
   * @returns The newly created media record or null if an error occurred
   */
  async addMedia(tokenId: string, formData: FormData): Promise<VehicleMedia | null> {
    try {
      const client = getClient(true); // Use service role for uploads
      
      // First, ensure the vehicle profile exists
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) {
        console.error('Error fetching vehicle profile:', vehicleError);
        throw vehicleError;
      }
      
      if (!vehicle) {
        throw new Error(`Vehicle profile not found for token ID ${tokenId}`);
      }
      
      // Get the file from the form data
      const file = formData.get('file') as File;
      if (!file) {
        throw new Error('No file provided');
      }
      
      // Upload the file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${tokenId}/${fileName}`;
      
      const { error: uploadError } = await client.storage
        .from('vehicle-media')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = client.storage
        .from('vehicle-media')
        .getPublicUrl(filePath);
      
      // Add the media record
      const { data, error } = await client
        .from('vehicle_media')
        .insert([
          {
            vehicle_id: vehicle.id,
            url: publicUrl,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            caption: formData.get('caption') as string || '',
            category: formData.get('category') as string || 'general',
            is_featured: formData.get('is_featured') === 'true',
            metadata: {
              originalName: file.name,
              size: file.size,
              type: file.type
            }
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating media record:', error);
        throw error;
      }
      
      return data as VehicleMedia;
    } catch (error) {
      console.error('Error adding media:', error);
      return null;
    }
  },
  
  // Add a part to a vehicle
  async addPart(tokenId: string, partData: {
    category: string;
    description: string;
    link?: string;
    image?: File;
  }): Promise<Part | null> {
    try {
      const client = getClient(true);
      
      // First, ensure the vehicle profile exists
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);
      
      let imageUrl = null;
      
      // If there's an image, upload it first
      if (partData.image) {
        const fileName = `${Date.now()}_${partData.image.name}`;
        const filePath = `parts/${vehicle.id}/${fileName}`;
        
        // Upload the image to Supabase Storage
        const { error: uploadError } = await client.storage
          .from('vehicle-parts')
          .upload(filePath, partData.image, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) {
          console.error('Error uploading part image:', uploadError);
          throw uploadError;
        }
        
        // Get the public URL for the uploaded image
        const { data: urlData } = client.storage
          .from('vehicle-parts')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
      }
      
      // Create the part
      const { data: part, error: partError } = await client
        .from('parts')
        .insert({
          vehicle_id: vehicle.id,
          category: partData.category,
          description: partData.description || '',
          link: partData.link || null,
          image_url: imageUrl,
        })
        .select()
        .single();
      
      if (partError) {
        console.error('Error creating part:', partError);
        throw partError;
      }
      
      return part as Part;
    } catch (error) {
      console.error('Error adding part:', error);
      return null;
    }
  },
  
  // Get parts for a vehicle
  async getVehicleParts(tokenId: string): Promise<Part[]> {
    try {
      const client = getClient();
      
      // First, get the vehicle ID
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;
      if (!vehicle) return [];
      
      // Get parts for the vehicle
      const { data: parts, error: partsError } = await client
        .from('parts')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (partsError) throw partsError;
      
      return parts as Part[] || [];
    } catch (error) {
      console.error('Error fetching vehicle parts:', error);
      return [];
    }
  },
  
  // Add a video to a vehicle
  async addVideo(
    tokenId: string,
    videoData: {
      title: string;
      youtube_url: string;
      description?: string;
      date?: string;
    }
  ): Promise<VehicleVideo | null> {
    try {
      const client = getClient(true);
      
      // First, ensure the vehicle profile exists
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);
      
      // Create the video
      const { data: video, error } = await client
        .from('vehicle_videos')
        .insert([
          {
            vehicle_id: vehicle.id,
            title: videoData.title,
            youtube_url: videoData.youtube_url,
            description: videoData.description || null,
            date: videoData.date || new Date().toISOString(),
          },
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      return video as VehicleVideo;
    } catch (error) {
      console.error('Error adding video:', error);
      return null;
    }
  },
  
  // Get videos for a vehicle
  async getVehicleVideos(tokenId: string): Promise<VehicleVideo[]> {
    try {
      const client = getClient();
      
      // First, get the vehicle ID
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;
      if (!vehicle) return [];
      
      // Get videos for the vehicle
      const { data: videos, error } = await client
        .from('vehicle_videos')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return videos as VehicleVideo[] || [];
    } catch (error) {
      console.error('Error fetching vehicle videos:', error);
      return [];
    }
  },
};