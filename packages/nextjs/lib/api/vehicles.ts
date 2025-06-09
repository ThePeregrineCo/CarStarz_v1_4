import { getSupabaseClient } from '../supabase'
import type { Database } from '../types/database'

type DbVehicleProfile = Database['public']['Tables']['vehicle_profiles']['Row']
type DbVehicleMod = Database['public']['Tables']['vehicle_modifications']['Row']
type DbVehicleMedia = Database['public']['Tables']['vehicle_media']['Row']
type DbVehicleAuditLog = Database['public']['Tables']['vehicle_audit_log']['Row']
type DbVehicleLink = Database['public']['Tables']['vehicle_links']['Row']
type DbVehicleSpec = Database['public']['Tables']['vehicle_specifications']['Row']
type DbVehicleComment = Database['public']['Tables']['vehicle_comments']['Row']

export interface VehicleProfile extends DbVehicleProfile {
  vehicle_modifications?: {
    id: string
    name: string
    description: string
    category: string
    created_at: string
    updated_at: string
  }[]
  vehicle_media?: {
    id: string
    url: string
    type: 'image' | 'video'
    caption: string
    category?: string
    is_featured?: boolean
    metadata?: any
    created_at: string
    updated_at: string
  }[]
  vehicle_links?: {
    id: string
    title: string
    url: string
    type: string
    icon?: string
    created_at: string
    updated_at: string
  }[]
  vehicle_specifications?: {
    id: string
    category: string
    name: string
    value: string
    created_at: string
    updated_at: string
  }[]
  vehicle_comments?: {
    id: string
    user_wallet: string
    content: string
    created_at: string
    updated_at: string
  }[]
  vehicle_videos?: {
    id: string
    title: string
    youtube_url: string
    description: string
    date: string
    created_at: string
    updated_at: string
  }[]
}

export interface VehicleModification {
  name: string
  description: string
  category: string
}

export interface VehicleMedia {
  url: string
  type: 'image' | 'video'
  caption: string
  category?: string
  is_featured?: boolean
  metadata?: any
}

export interface VehicleLink {
  title: string
  url: string
  type: string
  icon?: string | null
}

export interface VehicleSpecification {
  category: string
  name: string
  value: string
}

export interface VehicleComment {
  user_wallet: string
  content: string
}

export interface AuditLogEntry {
  action: string
  details: {
    content: string
    user_wallet: string
  }
}

// Helper function to get Supabase client
function getClient(useServiceRole = true) {
  // Always try to get the real client first
  const client = getSupabaseClient(useServiceRole);
  
  // If client is available, return it
  if (client) {
    return client;
  }
  
  // Log more detailed information about the missing client
  console.error(`Failed to get Supabase client with useServiceRole=${useServiceRole}`);
  console.error('Check that environment variables are properly set:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
  
  // Check if we're on the client side
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    console.warn('Supabase client not available on client side. Using mock client for read operations.');
    
    // Create a more comprehensive mock client that implements the methods we use
    // This prevents errors when the app is rendered on the client side
    const mockClient = {
      from: (table: string) => {
        const builder = {
          select: (columns?: string) => {
            return {
              eq: (column: string, value: any) => {
                return {
                  single: async () => ({ data: null, error: null }),
                  order: (column: string, options?: any) => ({ data: [], error: null }),
                };
              },
              order: (column: string, options?: any) => ({ data: [], error: null }),
            };
          },
          insert: (values: any) => ({
            select: (columns?: string) => ({
              single: async () => ({ data: null, error: null }),
            }),
          }),
          update: (values: any) => ({
            eq: (column: string, value: any) => ({ error: null }),
          }),
          delete: () => ({
            eq: (column: string, value: any) => ({ error: null }),
          }),
        };
        return builder;
      },
      storage: {
        from: (bucket: string) => ({
          upload: async (path: string, file: any) => ({ data: null, error: null }),
          getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
        }),
      },
      rpc: (func: string, params?: any) => ({ data: null, error: null }),
    };
    
    return mockClient as any;
  }
  
  // If we're on the server side and client is not available, log a warning but don't throw
  // This helps with development when environment variables might not be set
  console.error('Supabase client not available on server side - check your environment variables');
  
  // Return a mock client as a fallback
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: 'Supabase client not configured' } }),
        }),
      }),
    }),
  } as any;
}

export const vehicleProfiles = {
  // Get all vehicle profiles
  async getAll() {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('vehicle_profiles')
        .select(`
          *,
          vehicle_media(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle profiles:', error);
      return [];
    }
  },

  // Get a vehicle profile by token ID
  async getByTokenId(tokenId: string) {
    try {
      console.log(`[DEBUG] getByTokenId called with tokenId: ${tokenId}`);
      const client = getClient();
      
      if (!client) {
        console.error('Supabase client not available - missing environment variables');
        return null;
      }
      
      console.log(`[DEBUG] Supabase client obtained, querying vehicle_profiles for token_id: ${tokenId}`);
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
        console.error(`[DEBUG] Error fetching vehicle profile for token ID ${tokenId}:`, error);
        throw error;
      }
      
      console.log(`[DEBUG] Fetched vehicle profile for token ID ${tokenId}:`, data);
      return data as VehicleProfile;
    } catch (error) {
      console.error(`Error fetching vehicle profile for token ID ${tokenId}:`, error);
      return null;
    }
  },

  // Create a new vehicle profile
  async create(tokenId: string, data: Partial<DbVehicleProfile>, useServiceRole = false) {
    try {
      const client = getClient(useServiceRole);
      const { data: newProfile, error } = await client
        .from('vehicle_profiles')
        .insert([{ token_id: tokenId, ...data }])
        .select()
        .single();

      if (error) throw error;
      return newProfile;
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

  // Update a vehicle profile
  async update(tokenId: string, data: Partial<DbVehicleProfile>, useServiceRole = false) {
    try {
      console.log("Saving to Supabase:", data, tokenId);
      
      const client = getClient(useServiceRole);
      
      // First check if the row exists
      const { data: existingData, error: checkError } = await client
        .from('vehicle_profiles')
        .select('id, token_id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking if vehicle exists:", checkError.message);
        throw checkError;
      }
      
      if (!existingData) {
        console.error("No vehicle found with token_id:", tokenId);
        throw new Error(`No vehicle found with token_id: ${tokenId}`);
      }
      
      console.log("Matched row:", existingData);
      
      // Ensure tokenId is a number if needed
      const tokenIdNum = typeof tokenId === 'string' ? parseInt(tokenId, 10) : tokenId;
      
      // Perform the update
      const { error } = await client
        .from('vehicle_profiles')
        .update(data)
        .eq('token_id', tokenIdNum);

      if (error) {
        console.error("Supabase update failed:", error.message);
        throw error;
      }
      
      console.log("Vehicle profile updated successfully!");
      return true;
    } catch (error) {
      console.error('Error updating vehicle profile:', error);
      throw error;
    }
  },

  // Add a modification to a vehicle
  async addModification(tokenId: number, mod: VehicleModification) {
    try {
      // First, ensure the vehicle profile exists
      const client = getClient();
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);

      // Add the modification
      const { data: modification, error: modError } = await client
        .from('vehicle_modifications')
        .insert([
          {
            vehicle_id: vehicle.id,
            name: mod.name,
            description: mod.description,
            category: mod.category,
          },
        ])
        .select()
        .maybeSingle();

      if (modError) throw modError;

      // Log the action
      await this.logAction(tokenId, 'add_modification', `Added modification: ${mod.name}`);

      return modification;
    } catch (error) {
      console.error('Error adding vehicle modification:', error);
      throw error;
    }
  },

  // Add media to a vehicle
  async addMedia(tokenId: string, formData: FormData) {
    try {
      const client = getClient(true); // Explicitly use service role
      // First, ensure the vehicle profile exists
      const { data: vehicle } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();

      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);

      // Get the file from the form data
      const file = formData.get('file') as File;
      if (!file) throw new Error('No file provided');

      // Upload the file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${tokenId}/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('vehicle-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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
          },
        ])
        .select()
        .maybeSingle();

      if (error) throw error;

      // Log the action
      await this.logAction(tokenId, 'add_media', `Added ${data.type}`);

      return data;
    } catch (error) {
      console.error('Error adding vehicle media:', error);
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  // Add a link to a vehicle
  async addLink(tokenId: number, link: VehicleLink) {
    try {
      // First, ensure the vehicle profile exists
      const client = getClient();
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);

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
        .maybeSingle();

      if (linkError) throw linkError;

      // Log the action
      await this.logAction(tokenId, 'add_link', `Added link: ${link.title}`);

      return newLink;
    } catch (error) {
      console.error('Error adding vehicle link:', error);
      throw error;
    }
  },

  // Add a specification to a vehicle
  async addSpecification(tokenId: number, spec: VehicleSpecification) {
    try {
      // First, ensure the vehicle profile exists
      const client = getClient();
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);

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
        .maybeSingle();

      if (specError) throw specError;

      // Log the action
      await this.logAction(tokenId, 'add_specification', `Added specification: ${spec.name}`);

      return newSpec;
    } catch (error) {
      console.error('Error adding vehicle specification:', error);
      throw error;
    }
  },

  // Add a comment to a vehicle
  // Add a video to a vehicle
  async addVideo(tokenId: number, video: { title: string; youtube_url: string; description: string }) {
    try {
      // First, ensure the vehicle profile exists
      const client = getClient();
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);

      // Add the video
      const { data: newVideo, error: videoError } = await client
        .from('vehicle_videos')
        .insert([
          {
            vehicle_id: vehicle.id,
            title: video.title,
            youtube_url: video.youtube_url,
            description: video.description,
            date: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle();

      if (videoError) throw videoError;

      // Log the action
      await this.logAction(tokenId, 'add_video', `Added video: ${video.title}`);

      return newVideo;
    } catch (error) {
      console.error('Error adding vehicle video:', error);
      throw error;
    }
  },

  // Get videos for a vehicle
  async getVideos(tokenId: string) {
    try {
      const client = getClient();
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);

      const { data, error } = await client
        .from('vehicle_videos')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle videos:', error);
      return [];
    }
  },

  // Delete a video
  async deleteVideo(videoId: string) {
    try {
      const client = getClient();
      const { error } = await client
        .from('vehicle_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle video:', error);
      throw error;
    }
  },

  async addComment(tokenId: number, comment: VehicleComment) {
    try {
      // First, ensure the vehicle profile exists
      const client = getClient();
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${tokenId}`);

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
        .maybeSingle();

      if (commentError) throw commentError;

      return newComment;
    } catch (error) {
      console.error('Error adding vehicle comment:', error);
      throw error;
    }
  },

  // Get modifications for a vehicle
  async getModifications(tokenId: string) {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('vehicle_modifications')
        .select('*')
        .eq('vehicle_id', tokenId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle modifications:', error);
      return [];
    }
  },

  // Delete a modification
  async deleteModification(modificationId: string) {
    try {
      const client = getClient();
      const { error } = await client
        .from('vehicle_modifications')
        .delete()
        .eq('id', modificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle modification:', error);
      throw error;
    }
  },

  // Get media for a vehicle
  async getMedia(tokenId: string) {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('vehicle_media')
        .select('*')
        .eq('vehicle_id', tokenId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle media:', error);
      return [];
    }
  },

  // Delete media
  async deleteMedia(mediaId: string) {
    try {
      const client = getClient();
      const { error } = await client
        .from('vehicle_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle media:', error);
      throw error;
    }
  },

  // Get links for a vehicle
  async getLinks(tokenId: string) {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('vehicle_links')
        .select('*')
        .eq('vehicle_id', tokenId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle links:', error);
      return [];
    }
  },

  // Delete a link
  async deleteLink(linkId: string) {
    try {
      const client = getClient();
      const { error } = await client
        .from('vehicle_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle link:', error);
      throw error;
    }
  },

  // Get specifications for a vehicle
  async getSpecifications(tokenId: string) {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('vehicle_specifications')
        .select('*')
        .eq('vehicle_id', tokenId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle specifications:', error);
      return [];
    }
  },

  // Delete a specification
  async deleteSpecification(specId: string) {
    try {
      const client = getClient();
      const { error } = await client
        .from('vehicle_specifications')
        .delete()
        .eq('id', specId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle specification:', error);
      throw error;
    }
  },

  // Get comments for a vehicle
  async getComments(tokenId: string) {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('vehicle_comments')
        .select('*')
        .eq('vehicle_id', tokenId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle comments:', error);
      return [];
    }
  },

  // Delete a comment
  async deleteComment(commentId: string) {
    try {
      const client = getClient();
      const { error } = await client
        .from('vehicle_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle comment:', error);
      throw error;
    }
  },

  // Log an action to the audit log
  async logAction(tokenId: string | number, action: string, details: string, userWallet?: string) {
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
        user_wallet: userWallet ? userWallet.toLowerCase() : 'system'
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
  },
};

// Export additional objects for API routes
export const vehicleLinks = {
  getAll: vehicleProfiles.getLinks,
  add: vehicleProfiles.addLink,
  delete: vehicleProfiles.deleteLink,
};

export const vehicleSpecs = {
  getAll: vehicleProfiles.getSpecifications,
  add: vehicleProfiles.addSpecification,
  delete: vehicleProfiles.deleteSpecification,
};

export const vehicleComments = {
  getAll: vehicleProfiles.getComments,
  add: vehicleProfiles.addComment,
  delete: vehicleProfiles.deleteComment,
};

export const vehicleMedia = {
  getByVehicleId: vehicleProfiles.getMedia.bind(vehicleProfiles),
  create: vehicleProfiles.addMedia.bind(vehicleProfiles),
  delete: vehicleProfiles.deleteMedia.bind(vehicleProfiles),
};

export const vehicleMods = {
  getByVehicleId: vehicleProfiles.getModifications.bind(vehicleProfiles),
  create: vehicleProfiles.addModification.bind(vehicleProfiles),
  delete: vehicleProfiles.deleteModification.bind(vehicleProfiles),
};

export const auditLog = {
  getByVehicleId: async (vehicleId: string) => {
    try {
      const client = getClient();
      
      // First, get the vehicle_id (UUID) from the token_id
      const { data: vehicle, error: vehicleError } = await client
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', vehicleId)
        .maybeSingle();
      
      if (vehicleError) throw vehicleError;
      if (!vehicle) throw new Error(`Vehicle profile not found for token ID ${vehicleId}`);
      
      // Get audit logs for this vehicle
      const { data, error } = await client
        .from('vehicle_audit_log')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match the AuditLogEntry interface
      return data.map((log: any) => ({
        action: log.action,
        details: log.details,
        created_at: log.created_at
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
};