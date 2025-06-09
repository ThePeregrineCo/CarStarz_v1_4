/**
 * Supabase Vehicle Repository
 * 
 * This file implements the VehicleRepository interface using Supabase.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Vehicle, 
  CompleteVehicle, 
  VehicleCreateData, 
  VehicleUpdateData,
  VehicleMedia,
  VehicleSpecification,
  VehicleLink,
  VehicleModification,
  VehicleComment,
  VehicleVideo
} from '../../../core/entities/Vehicle';
import { VehicleRepository } from '../../../core/repositories/VehicleRepository';
import { 
  DatabaseError, 
  NotFoundError, 
  DuplicateError 
} from '../../../core/errors';

export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(private readonly supabase: SupabaseClient) {}
  
  /**
   * Get a vehicle by its token ID
   */
  async getByTokenId(tokenId: string): Promise<CompleteVehicle | null> {
    try {
      // Get the vehicle profile
      const { data: vehicle, error } = await this.supabase
        .from('vehicle_profiles')
        .select(`
          *,
          vehicle_media(*),
          vehicle_specifications(*),
          vehicle_links(*),
          vehicle_videos(*),
          vehicle_modifications(*),
          vehicle_comments(*)
        `)
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (error) throw new DatabaseError(`Error fetching vehicle profile: ${error.message}`, error);
      if (!vehicle) return null;
      
      // Transform the data to match the CompleteVehicle interface
      return {
        id: vehicle.id,
        tokenId: vehicle.token_id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        name: vehicle.name,
        description: vehicle.description,
        ownerWallet: vehicle.owner_wallet,
        primaryImageUrl: vehicle.primary_image_url,
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at,
        media: vehicle.vehicle_media?.map((media: any) => ({
          id: media.id,
          vehicleId: media.vehicle_id,
          url: media.url,
          type: media.type,
          caption: media.caption,
          category: media.category,
          isFeatured: media.is_featured,
          metadata: media.metadata,
          createdAt: media.created_at,
          updatedAt: media.updated_at
        })),
        specifications: vehicle.vehicle_specifications?.map((spec: any) => ({
          id: spec.id,
          vehicleId: spec.vehicle_id,
          category: spec.category,
          name: spec.name,
          value: spec.value,
          createdAt: spec.created_at,
          updatedAt: spec.updated_at
        })),
        links: vehicle.vehicle_links?.map((link: any) => ({
          id: link.id,
          vehicleId: link.vehicle_id,
          title: link.title,
          url: link.url,
          type: link.type,
          icon: link.icon,
          createdAt: link.created_at,
          updatedAt: link.updated_at
        })),
        videos: vehicle.vehicle_videos?.map((video: any) => ({
          id: video.id,
          vehicleId: video.vehicle_id,
          title: video.title,
          youtubeUrl: video.youtube_url,
          description: video.description,
          date: video.date,
          createdAt: video.created_at,
          updatedAt: video.updated_at
        })),
        modifications: vehicle.vehicle_modifications?.map((mod: any) => ({
          id: mod.id,
          vehicleId: mod.vehicle_id,
          name: mod.name,
          description: mod.description,
          category: mod.category,
          imageUrl: mod.image_url,
          linkUrl: mod.link_url,
          createdAt: mod.created_at,
          updatedAt: mod.updated_at
        })),
        comments: vehicle.vehicle_comments?.map((comment: any) => ({
          id: comment.id,
          vehicleId: comment.vehicle_id,
          userWallet: comment.user_wallet,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at
        }))
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Error fetching vehicle profile: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
  
  /**
   * Get all vehicles with optional filtering
   */
  async getAll(params?: {
    make?: string;
    model?: string;
    year?: number;
    ownerWallet?: string;
    limit?: number;
    offset?: number;
  }): Promise<CompleteVehicle[]> {
    try {
      // Build the query
      let query = this.supabase
        .from('vehicle_profiles')
        .select(`
          *,
          vehicle_media(*),
          vehicle_specifications(*),
          vehicle_links(*),
          vehicle_videos(*)
        `);
      
      // Apply filters
      if (params?.make) query = query.ilike('make', `%${params.make}%`);
      if (params?.model) query = query.ilike('model', `%${params.model}%`);
      if (params?.year) query = query.eq('year', params.year);
      if (params?.ownerWallet) {
        // Always ensure wallet addresses are lowercase for consistent querying
        const normalizedWallet = params.ownerWallet.toLowerCase();
        query = query.eq('owner_wallet', normalizedWallet);
      }
      
      // Apply pagination
      if (params?.limit) query = query.limit(params.limit);
      if (params?.offset) query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      
      // Execute query
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new DatabaseError(`Error fetching vehicles: ${error.message}`, error);
      if (!data || data.length === 0) return [];
      
      // Transform the data to match the CompleteVehicle interface
      return data.map(vehicle => ({
        id: vehicle.id,
        tokenId: vehicle.token_id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        name: vehicle.name,
        description: vehicle.description,
        ownerWallet: vehicle.owner_wallet,
        primaryImageUrl: vehicle.primary_image_url,
        createdAt: vehicle.created_at,
        updatedAt: vehicle.updated_at,
        media: vehicle.vehicle_media?.map((media: any) => ({
          id: media.id,
          vehicleId: media.vehicle_id,
          url: media.url,
          type: media.type,
          caption: media.caption,
          category: media.category,
          isFeatured: media.is_featured,
          metadata: media.metadata,
          createdAt: media.created_at,
          updatedAt: media.updated_at
        })),
        specifications: vehicle.vehicle_specifications?.map((spec: any) => ({
          id: spec.id,
          vehicleId: spec.vehicle_id,
          category: spec.category,
          name: spec.name,
          value: spec.value,
          createdAt: spec.created_at,
          updatedAt: spec.updated_at
        })),
        links: vehicle.vehicle_links?.map((link: any) => ({
          id: link.id,
          vehicleId: link.vehicle_id,
          title: link.title,
          url: link.url,
          type: link.type,
          icon: link.icon,
          createdAt: link.created_at,
          updatedAt: link.updated_at
        })),
        videos: vehicle.vehicle_videos?.map((video: any) => ({
          id: video.id,
          vehicleId: video.vehicle_id,
          title: video.title,
          youtubeUrl: video.youtube_url,
          description: video.description,
          date: video.date,
          createdAt: video.created_at,
          updatedAt: video.updated_at
        }))
      }));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Error fetching vehicles: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
  
  /**
   * Create a new vehicle profile
   */
  async create(data: VehicleCreateData): Promise<Vehicle> {
    try {
      // Insert the new vehicle profile
      const { data: newProfile, error } = await this.supabase
        .from('vehicle_profiles')
        .insert([{
          token_id: data.tokenId,
          vin: data.vin,
          make: data.make,
          model: data.model,
          year: data.year,
          name: data.name,
          description: data.description,
          owner_wallet: data.ownerWallet,
          primary_image_url: data.primaryImageUrl
        }])
        .select()
        .single();
      
      if (error) {
        // Check for duplicate VIN error
        if (error.code === '23505' && error.details?.includes('vehicle_profiles_vin_key')) {
          throw new DuplicateError('Vehicle', 'VIN', data.vin);
        }
        
        // Check for duplicate token ID error
        if (error.code === '23505' && error.details?.includes('vehicle_profiles_token_id_key')) {
          throw new DuplicateError('Vehicle', 'token ID', data.tokenId);
        }
        
        throw new DatabaseError(`Error creating vehicle profile: ${error.message}`, error);
      }
      
      if (!newProfile) {
        throw new DatabaseError('Failed to create vehicle profile: No data returned');
      }
      
      // Transform the data to match the Vehicle interface
      return {
        id: newProfile.id,
        tokenId: newProfile.token_id,
        vin: newProfile.vin,
        make: newProfile.make,
        model: newProfile.model,
        year: newProfile.year,
        name: newProfile.name,
        description: newProfile.description,
        ownerWallet: newProfile.owner_wallet,
        primaryImageUrl: newProfile.primary_image_url,
        createdAt: newProfile.created_at,
        updatedAt: newProfile.updated_at
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof DuplicateError) throw error;
      throw new DatabaseError(`Error creating vehicle profile: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
  
  /**
   * Update an existing vehicle profile
   */
  async update(tokenId: string, data: VehicleUpdateData): Promise<boolean> {
    try {
      // First check if the vehicle exists
      const { data: existingVehicle, error: checkError } = await this.supabase
        .from('vehicle_profiles')
        .select('id, token_id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (checkError) {
        throw new DatabaseError(`Error checking if vehicle exists: ${checkError.message}`, checkError);
      }
      
      if (!existingVehicle) {
        throw new NotFoundError('Vehicle', tokenId);
      }
      
      // Update the vehicle profile
      const { error } = await this.supabase
        .from('vehicle_profiles')
        .update({
          name: data.name,
          description: data.description,
          primary_image_url: data.primaryImageUrl
        })
        .eq('token_id', tokenId);
      
      if (error) {
        throw new DatabaseError(`Error updating vehicle profile: ${error.message}`, error);
      }
      
      return true;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Error updating vehicle profile: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
  
  /**
   * Add media to a vehicle
   */
  async addMedia(tokenId: string, formData: FormData): Promise<VehicleMedia> {
    try {
      // First, ensure the vehicle profile exists
      const { data: vehicle, error: vehicleError } = await this.supabase
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) {
        throw new DatabaseError(`Error fetching vehicle profile: ${vehicleError.message}`, vehicleError);
      }
      
      if (!vehicle) {
        throw new NotFoundError('Vehicle', tokenId);
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
      
      const { error: uploadError } = await this.supabase.storage
        .from('vehicle-media')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new DatabaseError(`Error uploading file: ${uploadError.message}`, uploadError);
      }
      
      // Get the public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('vehicle-media')
        .getPublicUrl(filePath);
      
      // Add the media record
      const { data, error } = await this.supabase
        .from('vehicle_media')
        .insert([{
          vehicle_id: vehicle.id,
          url: publicUrl,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          caption: formData.get('caption') as string || '',
          category: formData.get('category') as string || 'general',
          is_featured: formData.get('is_featured') === 'true',
        }])
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Error adding media record: ${error.message}`, error);
      }
      
      // Transform the data to match the VehicleMedia interface
      return {
        id: data.id,
        vehicleId: data.vehicle_id,
        url: data.url,
        type: data.type,
        caption: data.caption,
        category: data.category,
        isFeatured: data.is_featured,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Error adding media: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
  
  /**
   * Get media for a vehicle
   */
  async getMedia(tokenId: string): Promise<VehicleMedia[]> {
    try {
      // First, ensure the vehicle profile exists
      const { data: vehicle, error: vehicleError } = await this.supabase
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) {
        throw new DatabaseError(`Error fetching vehicle profile: ${vehicleError.message}`, vehicleError);
      }
      
      if (!vehicle) {
        throw new NotFoundError('Vehicle', tokenId);
      }
      
      // Get the media
      const { data, error } = await this.supabase
        .from('vehicle_media')
        .select('*')
        .eq('vehicle_id', vehicle.id);
      
      if (error) {
        throw new DatabaseError(`Error fetching media: ${error.message}`, error);
      }
      
      // Transform the data to match the VehicleMedia interface
      return data.map(media => ({
        id: media.id,
        vehicleId: media.vehicle_id,
        url: media.url,
        type: media.type,
        caption: media.caption,
        category: media.category,
        isFeatured: media.is_featured,
        metadata: media.metadata,
        createdAt: media.created_at,
        updatedAt: media.updated_at
      }));
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Error fetching media: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
  
  /**
   * Delete media
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      // Get the media to get the URL
      const { data: media, error: mediaError } = await this.supabase
        .from('vehicle_media')
        .select('url')
        .eq('id', mediaId)
        .maybeSingle();
      
      if (mediaError) {
        throw new DatabaseError(`Error fetching media: ${mediaError.message}`, mediaError);
      }
      
      if (!media) {
        throw new NotFoundError('Media', mediaId);
      }
      
      // Delete the media record
      const { error } = await this.supabase
        .from('vehicle_media')
        .delete()
        .eq('id', mediaId);
      
      if (error) {
        throw new DatabaseError(`Error deleting media: ${error.message}`, error);
      }
      
      // Try to delete the file from storage if it's in the vehicle-media bucket
      try {
        const url = new URL(media.url);
        const path = url.pathname.split('/').slice(2).join('/');
        
        if (path) {
          await this.supabase.storage
            .from('vehicle-media')
            .remove([path]);
        }
      } catch (storageError) {
        // Log the error but don't fail the operation
        console.warn('Error deleting file from storage:', storageError);
      }
      
      return true;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Error deleting media: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
  
  // Implementation of other methods would follow the same pattern
  // For brevity, I'll leave them out for now
  
  /**
   * Add a specification to a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addSpecification(tokenId: string, spec: {
    category: string;
    name: string;
    value: string;
  }): Promise<VehicleSpecification> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Get specifications for a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSpecifications(tokenId: string): Promise<VehicleSpecification[]> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Delete a specification
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteSpecification(specId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Add a link to a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addLink(tokenId: string, link: {
    title: string;
    url: string;
    type: string;
    icon?: string;
  }): Promise<VehicleLink> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Get links for a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getLinks(tokenId: string): Promise<VehicleLink[]> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Delete a link
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteLink(linkId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Add a modification to a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addModification(tokenId: string, mod: {
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    linkUrl?: string;
  }): Promise<VehicleModification> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Get modifications for a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getModifications(tokenId: string): Promise<VehicleModification[]> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Delete a modification
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteModification(modificationId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Add a comment to a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addComment(tokenId: string, comment: {
    userWallet: string;
    content: string;
  }): Promise<VehicleComment> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Get comments for a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getComments(tokenId: string): Promise<VehicleComment[]> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Delete a comment
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteComment(commentId: string, userWallet?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Add a video to a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addVideo(tokenId: string, video: {
    title: string;
    youtubeUrl: string;
    description?: string;
  }): Promise<VehicleVideo> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Get videos for a vehicle
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getVideos(tokenId: string): Promise<VehicleVideo[]> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Delete a video
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteVideo(videoId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Log an action in the vehicle audit log
   */
  async logAction(tokenId: string, action: string, details: string, userWallet?: string): Promise<void> {
    try {
      // First, ensure the vehicle profile exists
      const { data: vehicle, error: vehicleError } = await this.supabase
        .from('vehicle_profiles')
        .select('id')
        .eq('token_id', tokenId)
        .maybeSingle();
      
      if (vehicleError) {
        throw new DatabaseError(`Error fetching vehicle profile: ${vehicleError.message}`, vehicleError);
      }
      
      if (!vehicle) {
        throw new NotFoundError('Vehicle', tokenId);
      }
      
      // Log the action
      const { error } = await this.supabase
        .from('vehicle_audit_log')
        .insert([{
          vehicle_id: vehicle.id,
          action,
          details: {
            content: details,
            user_wallet: userWallet || 'system'
          }
        }]);
      
      if (error) {
        throw new DatabaseError(`Error logging action: ${error.message}`, error);
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Error logging action: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }
}