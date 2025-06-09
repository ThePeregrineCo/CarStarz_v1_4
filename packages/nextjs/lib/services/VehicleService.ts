import { 
  VehicleProfile, 
  CompleteVehicleProfile, 
  VehicleSearchOptions 
} from '../models/VehicleProfile';
import { vehicleProfileRepository } from '../repositories/VehicleProfileRepository';
import { identityProfileRepository } from '../repositories/IdentityProfileRepository';

/**
 * Vehicle Service
 * Handles business logic for vehicle profiles
 */
export class VehicleService {
  private repository = vehicleProfileRepository;
  private identityRepository = identityProfileRepository;
  
  /**
   * Get a complete vehicle profile by token ID
   * @param tokenId The token ID
   * @returns The complete vehicle profile or null if not found
   */
  async getVehicleByTokenId(tokenId: string): Promise<CompleteVehicleProfile | null> {
    return this.repository.findByTokenId(tokenId);
  }
  
  /**
   * Search for vehicles with filters
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  async searchVehicles(options: VehicleSearchOptions = {}): Promise<CompleteVehicleProfile[]> {
    return this.repository.search(options);
  }
  
  /**
   * Get vehicles owned by a specific wallet address
   * @param walletAddress The wallet address
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  /**
   * Get vehicles owned by a wallet address by looking up the identity first
   * @param walletAddress The wallet address
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  async getVehiclesByOwnerWallet(
    walletAddress: string,
    options: Omit<VehicleSearchOptions, 'owner_id'> = {}
  ): Promise<CompleteVehicleProfile[]> {
    // Find the identity for this wallet address
    const identity = await this.identityRepository.findByWalletAddress(walletAddress.toLowerCase());
    
    // If no identity found, return empty array
    if (!identity) {
      return [];
    }
    
    // Get vehicles by owner ID
    return this.getVehiclesByOwnerId(identity.id, options);
  }
  
  /**
   * Get vehicles owned by a specific identity
   * @param identityId The identity ID
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  async getVehiclesByOwnerId(
    ownerId: string,
    options: Omit<VehicleSearchOptions, 'owner_id'> = {}
  ): Promise<CompleteVehicleProfile[]> {
    return this.repository.getVehiclesByOwnerId(ownerId, options);
  }
  
  /**
   * Create a new vehicle profile
   * @param data The vehicle profile data
   * @param walletAddress The authenticated wallet address
   * @returns The created vehicle profile
   */
  async createVehicle(data: Partial<VehicleProfile>, walletAddress: string): Promise<VehicleProfile> {
    try {
      // Normalize the wallet address
      const normalizedWallet = walletAddress.toLowerCase();
      
      // Find identity for this wallet
      const identity = await this.identityRepository.findByWalletAddress(normalizedWallet);
      
      // Require that an identity already exists
      if (!identity) {
        console.error(`No identity found for wallet address ${normalizedWallet}`);
        throw new Error(
          "You must create a user profile before minting a vehicle. " +
          "Please register a profile first and then try minting again."
        );
      }
      
      console.log(`Using existing identity for wallet address ${normalizedWallet} with ID ${identity.id}`);
      
      // Set the owner_id to the identity ID
      data.owner_id = identity.id;
      
      // Create the vehicle profile
      return this.repository.createVehicleProfile(data);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }
  
  /**
   * Update a vehicle profile
   * @param tokenId The token ID
   * @param data The updated vehicle data
   * @param walletAddress The authenticated wallet address
   * @returns The updated vehicle profile or null if not found or unauthorized
   */
  async updateVehicle(
    tokenId: string, 
    data: Partial<VehicleProfile>, 
    walletAddress: string
  ): Promise<VehicleProfile | null> {
    try {
      // Normalize the wallet address
      const normalizedWallet = walletAddress.toLowerCase();
      
      // Get the existing vehicle profile
      const existingVehicle = await this.repository.findByTokenId(tokenId);
      
      // Check if the vehicle exists
      if (!existingVehicle) {
        throw new Error(`Vehicle with token ID ${tokenId} not found`);
      }
      
      // Get the identity for this wallet
      const identity = await this.identityRepository.findByWalletAddress(normalizedWallet);
      
      if (!identity) {
        throw new Error(`No identity found for wallet address ${normalizedWallet}`);
      }
      
      // Check if the authenticated user is the owner of the vehicle
      if (identity.id !== existingVehicle.owner_id) {
        throw new Error('Only the vehicle owner can update this profile');
      }
      
      // Update the vehicle profile
      return this.repository.updateByTokenId(tokenId, data);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }
  
  /**
   * Handle ownership transfer from blockchain events
   * @param tokenId The token ID
   * @param newOwnerWallet The new owner wallet address
   * @returns The updated vehicle profile or null if not found
   */
  async handleOwnershipTransfer(tokenId: string, newOwnerWallet: string): Promise<VehicleProfile | null> {
    try {
      // Normalize the wallet address
      const normalizedWallet = newOwnerWallet.toLowerCase();
      
      // Get the existing vehicle profile
      const existingVehicle = await this.repository.findByTokenId(tokenId);
      
      // Check if the vehicle exists
      if (!existingVehicle) {
        throw new Error(`Vehicle with token ID ${tokenId} not found`);
      }
      
      // Check if the wallet has an identity
      const identity = await this.identityRepository.findByWalletAddress(normalizedWallet);
      
      // Update the vehicle profile with the new owner
      if (!identity) {
        throw new Error(`No identity found for wallet address ${normalizedWallet}`);
      }
      
      const updateData: Partial<VehicleProfile> = {
        owner_id: identity.id
      };
      
      // Update the vehicle profile
      return this.repository.updateByTokenId(tokenId, updateData);
    } catch (error) {
      console.error('Error handling ownership transfer:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const vehicleService = new VehicleService();