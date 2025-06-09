import { getSupabaseClient } from '../supabase';

// Type definitions for the vehicle data
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

// User interface matching identity_registry
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
  owner_id: string; // Reference to identity_registry.id
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

// Define interface for vehicle comments
export interface VehicleComment {
  id: string;
  vehicle_id: string;
  user_wallet: string;
  content: string;
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
      
      // Get owner information separately
      let owner = null;
      if (vehicle.owner_id) {
        const { data: ownerData } = await client
          .from('identity_registry')
          .select('*')
          .eq('id', vehicle.owner_id)
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
    owner_id?: string;
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
      if (params.owner_id) {
        console.log(`[DEBUG QUERY] Filtering by owner_id: ${params.owner_id}`);
        query = query.eq('owner_id', params.owner_id);
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
      
      // Get all unique owner IDs
      const ownerIds = [...new Set(data.map(v => v.owner_id))].filter(Boolean);
      
      // Get owner information for all vehicles in a single query
      let owners: Record<string, User> = {};
      if (ownerIds.length > 0) {
        const { data: ownersData } = await client
          .from('identity_registry')
          .select('*')
          .in('id', ownerIds);
        
        if (ownersData) {
          // Create a map of owner ID to owner data
          owners = ownersData.reduce((acc, owner) => {
            if (owner.id) {
              acc[owner.id] = owner;
            }
            return acc;
          }, {} as Record<string, User>);
        }
      }
      
      // Combine vehicle data with owner data
      const completeVehicles = data.map(vehicle => {
        const ownerId = vehicle.owner_id;
        return {
          ...vehicle,
          owner: ownerId ? owners[ownerId] : undefined
        };
      });
      
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
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  // Add a part to a vehicle
  async addPart(tokenId: string, partData: {
    category: string;
    description: string;
    link?: string | null;
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
      
      // Prepare part data
      const partRecord: {
        vehicle_id: string;
        category: string;
        description: string;
        link: string | null;
        image_url?: string;
      } = {
        vehicle_id: vehicle.id,
        category: partData.category,
        description: partData.description,
        link: partData.link || null,
      };
      
      // Upload image if provided
      if (partData.image) {
        const fileExt = partData.image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${tokenId}/parts/${fileName}`;
        
        const { error: uploadError } = await client.storage
          .from('vehicle-media')
          .upload(filePath, partData.image);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = client.storage
          .from('vehicle-media')
          .getPublicUrl(filePath);
        
        // Add image URL to part record
        partRecord.image_url = publicUrl;
      }
      
      // Insert the part record
      const { data, error } = await client
        .from('parts')
        .insert([partRecord])
        .select()
        .single();
      
      if (error) throw error;
      return data as Part;
    } catch (error) {
      console.error('Error adding part:', error);
      return null;
    }
  },

  // Get parts for a vehicle
  async getVehicleParts(tokenId: string): Promise<Part[]> {
    try {
      const client = getClient();
      
      // First, get the vehicle profile
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;
      if (!vehicle) return [];
      
      // Get parts for the vehicle
      const { data, error } = await client
        .from('parts')
        .select('*')
        .eq('vehicle_id', vehicle.id);
      
      if (error) throw error;
      return data as Part[] || [];
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
      
      // Insert the video record
      const { data, error } = await client
        .from('vehicle_videos')
        .insert([{
          vehicle_id: vehicle.id,
          title: videoData.title,
          youtube_url: videoData.youtube_url,
          description: videoData.description || null,
          date: videoData.date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as VehicleVideo;
    } catch (error) {
      console.error('Error adding video:', error);
      return null;
    }
  },

  // Get videos for a vehicle
  async getVehicleVideos(tokenId: string): Promise<VehicleVideo[]> {
    try {
      const client = getClient();
      
      // First, get the vehicle profile
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;
      if (!vehicle) return [];
      
      // Get videos for the vehicle
      const { data, error } = await client
        .from('vehicle_videos')
        .select('*')
        .eq('vehicle_id', vehicle.id);
      
      if (error) throw error;
      return data as VehicleVideo[] || [];
    } catch (error) {
      console.error('Error fetching vehicle videos:', error);
      return [];
    }
  },

  // Get audit log for a vehicle
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

  // Log an action to the audit log
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

  // Add a comment to a vehicle
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
  
  // Get all comments for a vehicle
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
  
  // Delete a comment
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

  // End of methods
};

// Export the queries as the default implementation
export default vehicleQueries;