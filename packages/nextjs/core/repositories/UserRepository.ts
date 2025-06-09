/**
 * User Repository Interface
 * 
 * Defines the contract for accessing user data.
 * This follows the Repository pattern to abstract data access logic.
 */

import { 
  User, 
  CompleteUser, 
  UserCreateData, 
  UserUpdateData,
  SocialLink,
  Follow,
  UserCollection
} from '../entities/User';

export interface UserRepository {
  /**
   * Get a user by their wallet address
   */
  getByWallet(walletAddress: string): Promise<User | null>;
  
  /**
   * Get a user by their username
   */
  getByUsername(username: string): Promise<User | null>;
  
  /**
   * Get a complete user profile with all related data
   */
  getCompleteProfile(walletAddress: string): Promise<CompleteUser | null>;
  
  /**
   * Create a new user
   */
  create(data: UserCreateData): Promise<User>;
  
  /**
   * Update an existing user
   */
  update(walletAddress: string, data: UserUpdateData): Promise<boolean>;
  
  /**
   * Register a wallet in the identity registry
   */
  registerWallet(walletAddress: string, userId?: string): Promise<{
    success: boolean;
    identity?: any;
    error?: any;
  }>;
  
  /**
   * Check if a user owns a vehicle
   */
  isVehicleOwner(walletAddress: string, tokenId: string): Promise<boolean>;
  
  /**
   * Get vehicles owned by a user
   */
  getVehiclesByUser(walletAddress: string): Promise<any[]>;
  
  /**
   * Add a social link to a user
   */
  addSocialLink(walletAddress: string, link: {
    platform: string;
    url: string;
    displayName?: string;
  }): Promise<SocialLink>;
  
  /**
   * Get social links for a user
   */
  getSocialLinks(walletAddress: string): Promise<SocialLink[]>;
  
  /**
   * Delete a social link
   */
  deleteSocialLink(linkId: string): Promise<boolean>;
  
  /**
   * Follow another user
   */
  followUser(followerWallet: string, followedWallet: string): Promise<Follow>;
  
  /**
   * Unfollow a user
   */
  unfollowUser(followerWallet: string, followedWallet: string): Promise<boolean>;
  
  /**
   * Get users followed by a user
   */
  getFollowing(walletAddress: string): Promise<Follow[]>;
  
  /**
   * Get users following a user
   */
  getFollowers(walletAddress: string): Promise<Follow[]>;
  
  /**
   * Add a vehicle to a user's collection
   */
  addToCollection(userWallet: string, tokenId: string): Promise<UserCollection>;
  
  /**
   * Remove a vehicle from a user's collection
   */
  removeFromCollection(userWallet: string, tokenId: string): Promise<boolean>;
  
  /**
   * Get a user's collection
   */
  getCollection(userWallet: string): Promise<UserCollection[]>;
}