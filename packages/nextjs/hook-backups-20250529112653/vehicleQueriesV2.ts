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
  username: string | null;
  email: string | null;
  profile_image_url: string | null;
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

export const vehicleQueriesV2 = {
  // Get a complete vehicle profile with all relationships
  async getCompleteProfile(tokenId: string): Promise<CompleteVehicleProfile | null> {
    try {
      const client = getClient();
      
      // Get the vehicle profile
      const { data: vehicle, error } = await client
        .from('vehicle_profiles')
        .select(`
          *,
          owner:users!owner_wallet(id, wallet_address, username, profile_image_url),
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
          owner:users!owner_wallet(id, wallet_address, username, profile_image_url),
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
          owner:users!owner_wallet(id, wallet_address, username, profile_image_url),
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
          owner:users!owner_wallet(id, wallet_address, username, profile_image_url),
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
      // Extract only the fields that belong to the vehicle_profiles table
      // We're intentionally extracting and ignoring these fields as they don't belong in the vehicle_profiles table
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
      // Safely handle potential undefined properties
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
        console.error('Error inserting media record:', error);
        throw error;
      }
      
      // Log the action
      await this.logAction(tokenId, 'add_media', `Added ${data.type}`, formData.get('user_wallet') as string);
      
      return data as VehicleMedia;
    } catch (error) {
      console.error('Error adding vehicle media:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  },
  
  /**
   * Get all media for a vehicle
   * @param tokenId The token ID of the vehicle
   * @returns Array of media records
   */
  async getVehicleMedia(tokenId: string): Promise<VehicleMedia[]> {
    try {
      const client = getClient();
      
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
        console.warn(`Vehicle profile not found for token ID ${tokenId}`);
        return [];
      }
      
      const { data, error } = await client
        .from('vehicle_media')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicle media:', error);
        throw error;
      }
      
      return data as VehicleMedia[] || [];
    } catch (error) {
      console.error('Error fetching vehicle media:', error);
      return [];
    }
  },
  
  /**
   * Delete a media record
   * @param mediaId The ID of the media record to delete
   * @param userWallet Optional wallet address of the user performing the action
   * @returns True if successful, false otherwise
   */
  async deleteMedia(mediaId: string, userWallet?: string): Promise<boolean> {
    try {
      const client = getClient(true); // Use service role for deletions
      
      // First get the media record to find the associated vehicle
      const { data: media, error: mediaError } = await client
        .from('vehicle_media')
        .select('vehicle_id, url')
        .eq('id', mediaId)
        .maybeSingle();
      
      if (mediaError) {
        console.error('Error fetching media record:', mediaError);
        throw mediaError;
      }
      
      if (!media) {
        throw new Error(`Media record not found with ID ${mediaId}`);
      }
      
      // Get the vehicle token ID for audit logging
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('token_id')
        .eq('id', media.vehicle_id)
        .maybeSingle();
      
      if (vehicleError) {
        console.error('Error fetching vehicle profile:', vehicleError);
        throw vehicleError;
      }
      
      // Delete the media record
      const { error } = await client
        .from('vehicle_media')
        .delete()
        .eq('id', mediaId);
      
      if (error) {
        console.error('Error deleting media record:', error);
        throw error;
      }
      
      // Try to delete the file from storage if possible
      // Extract the path from the URL
      try {
        const url = new URL(media.url);
        const path = url.pathname.split('/').slice(-2).join('/');
        
        if (path) {
          await client.storage
            .from('vehicle-media')
            .remove([path]);
        }
      } catch (storageError) {
        // Log but don't fail if storage deletion fails
        console.warn('Could not delete file from storage:', storageError);
      }
      
      // Log the action
      if (vehicle) {
        await this.logAction(vehicle.token_id, 'delete_media', `Deleted media`, userWallet);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting vehicle media:', error);
      return false;
    }
  },
  
  // Vehicle Specifications Methods
  
  /**
   * Add a specification to a vehicle
   * @param tokenId The token ID of the vehicle
   * @param spec The specification to add
   * @param userWallet Optional wallet address of the user performing the action
   * @returns The newly created specification or null if an error occurred
   */
  async addSpecification(
    tokenId: string,
    spec: { category: string; name: string; value: string },
    userWallet?: string
  ): Promise<VehicleSpecification | null> {
    try {
      const client = getClient();
      
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
      
      // Add the specification
      const { data: newSpec, error: specError } = await client
        .from('vehicle_specifications')
        .insert([
          {
            vehicle_id: vehicle.id,
            category: spec.category,
            name: spec.name,
            value: spec.value,
          },
        ])
        .select()
        .single();
      
      if (specError) {
        console.error('Error inserting specification:', specError);
        throw specError;
      }
      
      // Log the action
      await this.logAction(tokenId, 'add_specification', `Added specification: ${spec.name}`, userWallet);
      
      return newSpec as VehicleSpecification;
    } catch (error) {
      console.error('Error adding vehicle specification:', error);
      return null;
    }
  },
  
  /**
   * Get all specifications for a vehicle
   * @param tokenId The token ID of the vehicle
   * @returns Array of specification records
   */
  async getVehicleSpecifications(tokenId: string): Promise<VehicleSpecification[]> {
    try {
      const client = getClient();
      
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
        console.warn(`Vehicle profile not found for token ID ${tokenId}`);
        return [];
      }
      
      const { data, error } = await client
        .from('vehicle_specifications')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('category', { ascending: true });
      
      if (error) {
        console.error('Error fetching vehicle specifications:', error);
        throw error;
      }
      
      return data as VehicleSpecification[] || [];
    } catch (error) {
      console.error('Error fetching vehicle specifications:', error);
      return [];
    }
  },
  
  /**
   * Delete a specification
   * @param specId The ID of the specification to delete
   * @param userWallet Optional wallet address of the user performing the action
   * @returns True if successful, false otherwise
   */
  async deleteSpecification(specId: string, userWallet?: string): Promise<boolean> {
    try {
      const client = getClient();
      
      // First get the specification to find the associated vehicle
      const { data: spec, error: specError } = await client
        .from('vehicle_specifications')
        .select('vehicle_id, name')
        .eq('id', specId)
        .maybeSingle();
      
      if (specError) {
        console.error('Error fetching specification:', specError);
        throw specError;
      }
      
      if (!spec) {
        throw new Error(`Specification not found with ID ${specId}`);
      }
      
      // Get the vehicle token ID for audit logging
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('token_id')
        .eq('id', spec.vehicle_id)
        .maybeSingle();
      
      if (vehicleError) {
        console.error('Error fetching vehicle profile:', vehicleError);
        throw vehicleError;
      }
      
      // Delete the specification
      const { error } = await client
        .from('vehicle_specifications')
        .delete()
        .eq('id', specId);
      
      if (error) {
        console.error('Error deleting specification:', error);
        throw error;
      }
      
      // Log the action
      if (vehicle) {
        await this.logAction(
          vehicle.token_id,
          'delete_specification',
          `Deleted specification: ${spec.name}`,
          userWallet
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting vehicle specification:', error);
      return false;
    }
  },
  
  // Vehicle Links Methods
  
  /**
   * Add a link to a vehicle
   * @param tokenId The token ID of the vehicle
   * @param link The link to add
   * @param userWallet Optional wallet address of the user performing the action
   * @returns The newly created link or null if an error occurred
   */
  async addLink(
    tokenId: string,
    link: { title: string; url: string; type: string; icon?: string | null },
    userWallet?: string
  ): Promise<VehicleLink | null> {
    try {
      const client = getClient();
      
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
      
      // Add the link
      const { data: newLink, error: linkError } = await client
        .from('vehicle_links')
        .insert([
          {
            vehicle_id: vehicle.id,
            title: link.title,
            url: link.url,
            type: link.type,
            icon: link.icon,
          },
        ])
        .select()
        .single();
      
      if (linkError) {
        console.error('Error inserting link:', linkError);
        throw linkError;
      }
      
      // Log the action
      await this.logAction(tokenId, 'add_link', `Added link: ${link.title}`, userWallet);
      
      return newLink as VehicleLink;
    } catch (error) {
      console.error('Error adding vehicle link:', error);
      return null;
    }
  },
  
  /**
   * Get all links for a vehicle
   * @param tokenId The token ID of the vehicle
   * @returns Array of link records
   */
  async getVehicleLinks(tokenId: string): Promise<VehicleLink[]> {
    try {
      const client = getClient();
      
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
        console.warn(`Vehicle profile not found for token ID ${tokenId}`);
        return [];
      }
      
      const { data, error } = await client
        .from('vehicle_links')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicle links:', error);
        throw error;
      }
      
      return data as VehicleLink[] || [];
    } catch (error) {
      console.error('Error fetching vehicle links:', error);
      return [];
    }
  },
  
  /**
   * Delete a link
   * @param linkId The ID of the link to delete
   * @param userWallet Optional wallet address of the user performing the action
   * @returns True if successful, false otherwise
   */
  async deleteLink(linkId: string, userWallet?: string): Promise<boolean> {
    try {
      const client = getClient();
      
      // First get the link to find the associated vehicle
      const { data: link, error: linkError } = await client
        .from('vehicle_links')
        .select('vehicle_id, title')
        .eq('id', linkId)
        .maybeSingle();
      
      if (linkError) {
        console.error('Error fetching link:', linkError);
        throw linkError;
      }
      
      if (!link) {
        throw new Error(`Link not found with ID ${linkId}`);
      }
      
      // Get the vehicle token ID for audit logging
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('token_id')
        .eq('id', link.vehicle_id)
        .maybeSingle();
      
      if (vehicleError) {
        console.error('Error fetching vehicle profile:', vehicleError);
        throw vehicleError;
      }
      
      // Delete the link
      const { error } = await client
        .from('vehicle_links')
        .delete()
        .eq('id', linkId);
      
      if (error) {
        console.error('Error deleting link:', error);
        throw error;
      }
      
      // Log the action
      if (vehicle) {
        await this.logAction(
          vehicle.token_id,
          'delete_link',
          `Deleted link: ${link.title}`,
          userWallet
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting vehicle link:', error);
      return false;
    }
  },
  
  // Vehicle Comments Methods
  
  /**
   * Add a comment to a vehicle
   * @param tokenId The token ID of the vehicle
   * @param comment The comment to add
   * @returns The newly created comment or null if an error occurred
   */
  async addComment(
    tokenId: string,
    comment: { user_wallet: string; content: string }
  ): Promise<VehicleComment | null> {
    try {
      const client = getClient();
      
      // Validate inputs
      if (!comment.user_wallet) {
        throw new Error('User wallet is required');
      }
      
      if (!comment.content || comment.content.trim() === '') {
        throw new Error('Comment content cannot be empty');
      }
      
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
      
      // Add the comment
      const { data: newComment, error: commentError } = await client
        .from('vehicle_comments')
        .insert([
          {
            vehicle_id: vehicle.id,
            user_wallet: comment.user_wallet.toLowerCase(),
            content: comment.content,
          },
        ])
        .select()
        .single();
      
      if (commentError) {
        console.error('Error inserting comment:', commentError);
        throw commentError;
      }
      
      // Log the action
      await this.logAction(
        tokenId,
        'add_comment',
        `Added comment: ${comment.content.substring(0, 30)}${comment.content.length > 30 ? '...' : ''}`,
        comment.user_wallet
      );
      
      return newComment as VehicleComment;
    } catch (error) {
      console.error('Error adding vehicle comment:', error);
      return null;
    }
  },
  
  /**
   * Get all comments for a vehicle
   * @param tokenId The token ID of the vehicle
   * @returns Array of comment records
   */
  async getVehicleComments(tokenId: string): Promise<VehicleComment[]> {
    try {
      const client = getClient();
      
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
        console.warn(`Vehicle profile not found for token ID ${tokenId}`);
        return [];
      }
      
      const { data, error } = await client
        .from('vehicle_comments')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicle comments:', error);
        throw error;
      }
      
      return data as VehicleComment[] || [];
    } catch (error) {
      console.error('Error fetching vehicle comments:', error);
      return [];
    }
  },
  
  /**
   * Delete a comment
   * @param commentId The ID of the comment to delete
   * @param userWallet Optional wallet address of the user performing the action
   * @returns True if successful, false otherwise
   */
  async deleteComment(commentId: string, userWallet?: string): Promise<boolean> {
    try {
      const client = getClient();
      
      // First get the comment to find the associated vehicle
      const { data: comment, error: commentError } = await client
        .from('vehicle_comments')
        .select('vehicle_id, user_wallet')
        .eq('id', commentId)
        .maybeSingle();
      
      if (commentError) {
        console.error('Error fetching comment:', commentError);
        throw commentError;
      }
      
      if (!comment) {
        throw new Error(`Comment not found with ID ${commentId}`);
      }
      
      // Get the vehicle token ID for audit logging
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('token_id')
        .eq('id', comment.vehicle_id)
        .maybeSingle();
      
      if (vehicleError) {
        console.error('Error fetching vehicle profile:', vehicleError);
        throw vehicleError;
      }
      
      // Delete the comment
      const { error } = await client
        .from('vehicle_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }
      
      // Log the action
      if (vehicle) {
        await this.logAction(
          vehicle.token_id,
          'delete_comment',
          `Deleted comment`,
          userWallet || comment.user_wallet
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting vehicle comment:', error);
      return false;
    }
  },
  
  // Audit Logging Methods
  
  /**
   * Log an action to the audit log
   * @param tokenId The token ID of the vehicle
   * @param action The action being performed
   * @param details Details about the action
   * @param userWallet Optional wallet address of the user performing the action
   * @returns The newly created audit log entry or null if an error occurred
   */
  async logAction(
    tokenId: string | number,
    action: string,
    details: string,
    userWallet?: string
  ): Promise<AuditLogEntry | null> {
    try {
      const client = getClient();
      
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
      
      // Store user_wallet within the details JSONB field
      const detailsJson = {
        content: details,
        user_wallet: userWallet ? userWallet.toLowerCase() : 'system'
      };
      
      const { data, error } = await client
        .from('vehicle_audit_log')
        .insert([
          {
            vehicle_id: vehicle.id,
            action,
            details: detailsJson,
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting audit log:', error);
        return null;
      }
      
      return data as AuditLogEntry;
    } catch (error) {
      console.error('Error logging action:', error);
      return null;
    }
  },
  
  /**
   * Get audit log entries for a vehicle
   * @param tokenId The token ID of the vehicle
   * @param limit Optional limit on the number of entries to return
   * @returns Array of audit log entries
   */
  async getAuditLog(tokenId: string, limit?: number): Promise<AuditLogEntry[]> {
    try {
      const client = getClient();
      
      // First, get the vehicle_id (UUID) from the token_id
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) {
        console.error(`Error finding vehicle with token ID ${tokenId}:`, vehicleError);
        return [];
      }
      
      if (!vehicle) {
        console.error(`No vehicle found with token ID ${tokenId}`);
        return [];
      }
      
      // Build the query
      let query = client
        .from('vehicle_audit_log')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      // Apply limit if provided
      if (limit) {
        query = query.limit(limit);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching audit log:', error);
        throw error;
      }
      
      return data as AuditLogEntry[] || [];
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  },
  
  // Vehicle Videos Methods (YouTube)
  
  /**
   * Add a YouTube video to a vehicle
   * @param tokenId The token ID of the vehicle
   * @param videoData The video data (title, youtube_url, description)
   * @param userWallet The wallet address of the user adding the video
   * @returns The newly created video record or null if an error occurred
   */
  async addVideo(
    tokenId: string,
    videoData: { title: string; youtube_url: string; description?: string },
    userWallet: string
  ): Promise<VehicleVideo | null> {
    try {
      const client = getClient();
      
      // Validate inputs
      if (!videoData.title || !videoData.title.trim()) {
        throw new Error('Video title is required');
      }
      
      if (!videoData.youtube_url || !videoData.youtube_url.trim()) {
        throw new Error('YouTube URL is required');
      }
      
      // Validate YouTube URL format
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(videoData.youtube_url)) {
        throw new Error('Invalid YouTube URL format');
      }
      
      // First, ensure the vehicle profile exists
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id, owner_wallet')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) {
        console.error('Error fetching vehicle profile:', vehicleError);
        throw vehicleError;
      }
      
      if (!vehicle) {
        throw new Error(`Vehicle profile not found for token ID ${tokenId}`);
      }
      
      // Check ownership in production mode
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev && vehicle.owner_wallet.toLowerCase() !== userWallet.toLowerCase()) {
        throw new Error('Only the vehicle owner can add videos');
      }
      
      // Add the video
      const { data: newVideo, error: videoError } = await client
        .from('vehicle_videos')
        .insert([
          {
            vehicle_id: vehicle.id,
            title: videoData.title,
            youtube_url: videoData.youtube_url,
            description: videoData.description || '',
            date: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      
      if (videoError) {
        console.error('Error inserting video:', videoError);
        throw videoError;
      }
      
      // Log the action
      await this.logAction(
        tokenId,
        'add_video',
        `Added YouTube video: ${videoData.title}`,
        userWallet
      );
      
      return newVideo as VehicleVideo;
    } catch (error) {
      console.error('Error adding vehicle video:', error);
      return null;
    }
  },
  
  /**
   * Get all YouTube videos for a vehicle
   * @param tokenId The token ID of the vehicle
   * @returns Array of video records
   */
  async getVehicleVideos(tokenId: string): Promise<VehicleVideo[]> {
    try {
      const client = getClient();
      
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
        console.warn(`Vehicle profile not found for token ID ${tokenId}`);
        return [];
      }
      
      const { data, error } = await client
        .from('vehicle_videos')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicle videos:', error);
        throw error;
      }
      
      return data as VehicleVideo[] || [];
    } catch (error) {
      console.error('Error fetching vehicle videos:', error);
      return [];
    }
  },
  
  /**
   * Delete a YouTube video
   * @param videoId The ID of the video to delete
   * @param userWallet The wallet address of the user deleting the video
   * @returns True if successful, false otherwise
   */
  async deleteVideo(videoId: string, userWallet: string): Promise<boolean> {
    try {
      const client = getClient();
      
      // First get the video to find the associated vehicle
      const { data: video, error: videoError } = await client
        .from('vehicle_videos')
        .select('vehicle_id, title')
        .eq('id', videoId)
        .maybeSingle();
      
      if (videoError) {
        console.error('Error fetching video:', videoError);
        throw videoError;
      }
      
      if (!video) {
        throw new Error(`Video not found with ID ${videoId}`);
      }
      
      // Get the vehicle profile to check ownership
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('token_id, owner_wallet')
        .eq('id', video.vehicle_id)
        .maybeSingle();
      
      if (vehicleError) {
        console.error('Error fetching vehicle profile:', vehicleError);
        throw vehicleError;
      }
      
      if (!vehicle) {
        throw new Error(`Vehicle profile not found for video ID ${videoId}`);
      }
      
      // Check ownership in production mode
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev && vehicle.owner_wallet.toLowerCase() !== userWallet.toLowerCase()) {
        throw new Error('Only the vehicle owner can delete videos');
      }
      
      // Delete the video
      const { error } = await client
        .from('vehicle_videos')
        .delete()
        .eq('id', videoId);
      
      if (error) {
        console.error('Error deleting video:', error);
        throw error;
      }
      
      // Log the action
      await this.logAction(
        vehicle.token_id,
        'delete_video',
        `Deleted YouTube video: ${video.title}`,
        userWallet
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting vehicle video:', error);
      return false;
    }
  },
};