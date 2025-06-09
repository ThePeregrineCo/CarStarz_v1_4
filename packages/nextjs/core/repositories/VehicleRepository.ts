/**
 * Vehicle Repository Interface
 * 
 * Defines the contract for accessing vehicle data.
 * This follows the Repository pattern to abstract data access logic.
 */

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
} from '../entities/Vehicle';

export interface VehicleRepository {
  /**
   * Get a vehicle by its token ID
   */
  getByTokenId(tokenId: string): Promise<CompleteVehicle | null>;
  
  /**
   * Get all vehicles with optional filtering
   */
  getAll(params?: {
    make?: string;
    model?: string;
    year?: number;
    ownerWallet?: string;
    limit?: number;
    offset?: number;
  }): Promise<CompleteVehicle[]>;
  
  /**
   * Create a new vehicle profile
   */
  create(data: VehicleCreateData): Promise<Vehicle>;
  
  /**
   * Update an existing vehicle profile
   */
  update(tokenId: string, data: VehicleUpdateData): Promise<boolean>;
  
  /**
   * Add media to a vehicle
   */
  addMedia(tokenId: string, formData: FormData): Promise<VehicleMedia>;
  
  /**
   * Get media for a vehicle
   */
  getMedia(tokenId: string): Promise<VehicleMedia[]>;
  
  /**
   * Delete media
   */
  deleteMedia(mediaId: string): Promise<boolean>;
  
  /**
   * Add a specification to a vehicle
   */
  addSpecification(tokenId: string, spec: {
    category: string;
    name: string;
    value: string;
  }): Promise<VehicleSpecification>;
  
  /**
   * Get specifications for a vehicle
   */
  getSpecifications(tokenId: string): Promise<VehicleSpecification[]>;
  
  /**
   * Delete a specification
   */
  deleteSpecification(specId: string): Promise<boolean>;
  
  /**
   * Add a link to a vehicle
   */
  addLink(tokenId: string, link: {
    title: string;
    url: string;
    type: string;
    icon?: string;
  }): Promise<VehicleLink>;
  
  /**
   * Get links for a vehicle
   */
  getLinks(tokenId: string): Promise<VehicleLink[]>;
  
  /**
   * Delete a link
   */
  deleteLink(linkId: string): Promise<boolean>;
  
  /**
   * Add a modification to a vehicle
   */
  addModification(tokenId: string, mod: {
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    linkUrl?: string;
  }): Promise<VehicleModification>;
  
  /**
   * Get modifications for a vehicle
   */
  getModifications(tokenId: string): Promise<VehicleModification[]>;
  
  /**
   * Delete a modification
   */
  deleteModification(modificationId: string): Promise<boolean>;
  
  /**
   * Add a comment to a vehicle
   */
  addComment(tokenId: string, comment: {
    userWallet: string;
    content: string;
  }): Promise<VehicleComment>;
  
  /**
   * Get comments for a vehicle
   */
  getComments(tokenId: string): Promise<VehicleComment[]>;
  
  /**
   * Delete a comment
   */
  deleteComment(commentId: string, userWallet?: string): Promise<boolean>;
  
  /**
   * Add a video to a vehicle
   */
  addVideo(tokenId: string, video: {
    title: string;
    youtubeUrl: string;
    description?: string;
  }): Promise<VehicleVideo>;
  
  /**
   * Get videos for a vehicle
   */
  getVideos(tokenId: string): Promise<VehicleVideo[]>;
  
  /**
   * Delete a video
   */
  deleteVideo(videoId: string): Promise<boolean>;
  
  /**
   * Log an action in the vehicle audit log
   */
  logAction(tokenId: string, action: string, details: string, userWallet?: string): Promise<void>;
}