import { 
  IdentityProfile, 
  CompleteIdentityProfile, 
  IdentitySearchOptions 
} from '../models/IdentityProfile';
import { identityProfileRepository } from '../repositories/IdentityProfileRepository';

/**
 * Identity Service
 * Handles business logic for identity profiles
 */
export class IdentityService {
  private repository = identityProfileRepository;
  
  /**
   * Get an identity profile by ID
   * @param id The identity profile ID
   * @returns The identity profile or null if not found
   */
  async getIdentityById(id: string): Promise<IdentityProfile | null> {
    return this.repository.findById(id);
  }
  
  /**
   * Get an identity profile by wallet address
   * @param walletAddress The wallet address
   * @returns The identity profile or null if not found
   */
  async getIdentityByWalletAddress(walletAddress: string): Promise<IdentityProfile | null> {
    return this.repository.findByWalletAddress(walletAddress);
  }
  
  /**
   * Get an identity profile by username
   * @param username The username
   * @returns The identity profile or null if not found
   */
  async getIdentityByUsername(username: string): Promise<IdentityProfile | null> {
    return this.repository.findByUsername(username);
  }
  
  /**
   * Get a complete identity profile with owned vehicles
   * @param id The identity profile ID
   * @returns The complete identity profile or null if not found
   */
  async getCompleteProfile(id: string): Promise<CompleteIdentityProfile | null> {
    return this.repository.getCompleteProfile(id);
  }
  
  /**
   * Get a complete identity profile with owned vehicles by wallet address
   * @param walletAddress The wallet address
   * @returns The complete identity profile or null if not found
   */
  async getCompleteProfileByWalletAddress(walletAddress: string): Promise<CompleteIdentityProfile | null> {
    return this.repository.getCompleteProfileByWalletAddress(walletAddress);
  }
  
  /**
   * Search for identity profiles
   * @param options Search options
   * @returns Array of identity profiles
   */
  async searchIdentities(options: IdentitySearchOptions = {}): Promise<IdentityProfile[]> {
    return this.repository.search(options);
  }
  
  /**
   * Create a new identity profile
   * @param data The identity profile data
   * @param walletAddress The authenticated wallet address
   * @returns The created identity profile
   */
  async createIdentity(data: Partial<IdentityProfile>, walletAddress: string): Promise<IdentityProfile> {
    try {
      // Normalize the wallet address
      const normalizedWallet = walletAddress.toLowerCase();
      
      // Check if the wallet already has an identity
      const existingIdentity = await this.repository.findByWalletAddress(normalizedWallet);
      
      if (existingIdentity) {
        throw new Error('Wallet already has an identity profile');
      }
      
      // Check if the username is already taken
      if (data.username) {
        const isAvailable = await this.repository.isUsernameAvailable(data.username);
        
        if (!isAvailable) {
          throw new Error('Username is already taken');
        }
      }
      
      // Ensure wallet_address is set
      data.wallet_address = walletAddress;
      data.normalized_wallet = normalizedWallet;
      
      // Create the identity profile
      return this.repository.createIdentityProfile(data);
    } catch (error) {
      console.error('Error creating identity:', error);
      throw error;
    }
  }
  
  /**
   * Update an identity profile
   * @param id The identity profile ID
   * @param data The updated identity data
   * @param walletAddress The authenticated wallet address
   * @returns The updated identity profile or null if not found or unauthorized
   */
  async updateIdentity(
    id: string, 
    data: Partial<IdentityProfile>, 
    walletAddress: string
  ): Promise<IdentityProfile | null> {
    try {
      // Normalize the wallet address
      const normalizedWallet = walletAddress.toLowerCase();
      
      // Get the existing identity profile
      const existingIdentity = await this.repository.findById(id);
      
      // Check if the identity exists
      if (!existingIdentity) {
        throw new Error(`Identity with ID ${id} not found`);
      }
      
      // Check if the authenticated user is the owner of the identity
      if (normalizedWallet !== existingIdentity.normalized_wallet.toLowerCase()) {
        throw new Error('Only the identity owner can update this profile');
      }
      
      // Check if the username is being changed and if it's available
      if (data.username && data.username !== existingIdentity.username) {
        const isAvailable = await this.repository.isUsernameAvailable(data.username);
        
        if (!isAvailable) {
          throw new Error('Username is already taken');
        }
      }
      
      // Update the identity profile
      return this.repository.update(id, data);
    } catch (error) {
      console.error('Error updating identity:', error);
      throw error;
    }
  }
  
  /**
   * Check if a username is available
   * @param username The username to check
   * @returns True if the username is available, false otherwise
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    return this.repository.isUsernameAvailable(username);
  }
}

// Export a singleton instance
export const identityService = new IdentityService();