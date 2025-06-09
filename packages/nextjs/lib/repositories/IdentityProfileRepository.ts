import { SupabaseRepository } from './SupabaseRepository';
import { 
  IdentityProfile, 
  CompleteIdentityProfile, 
  IdentitySearchOptions 
} from '../models/IdentityProfile';
import { VehicleProfile } from '../models/VehicleProfile';

/**
 * Identity Profile Repository
 * Handles database operations for identity profiles
 */
export class IdentityProfileRepository extends SupabaseRepository<IdentityProfile, string> {
  constructor(useServiceRole = true) {
    super('identity_registry', useServiceRole);
  }
  
  /**
   * Find an identity profile by wallet address
   * @param walletAddress The wallet address
   * @returns The identity profile or null if not found
   */
  async findByWalletAddress(walletAddress: string): Promise<IdentityProfile | null> {
    try {
      const normalizedWallet = walletAddress.toLowerCase();
      
      const { data, error } = await this.client
        .from('identity_registry')
        .select('*')
        .eq('normalized_wallet', normalizedWallet)
        .maybeSingle();
      
      if (error) throw error;
      return data as IdentityProfile;
    } catch (error) {
      console.error('Error finding identity by wallet address:', error);
      return null;
    }
  }
  
  /**
   * Find an identity profile by username
   * @param username The username
   * @returns The identity profile or null if not found
   */
  async findByUsername(username: string): Promise<IdentityProfile | null> {
    try {
      const { data, error } = await this.client
        .from('identity_registry')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      return data as IdentityProfile;
    } catch (error) {
      console.error('Error finding identity by username:', error);
      return null;
    }
  }
  
  /**
   * Get a complete identity profile with owned vehicles
   * @param id The identity profile ID
   * @returns The complete identity profile or null if not found
   */
  async getCompleteProfile(id: string): Promise<CompleteIdentityProfile | null> {
    try {
      // Get the identity profile
      const { data: identityData, error } = await this.client
        .from('identity_registry')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!identityData) return null;
      
      // Cast to IdentityProfile to ensure TypeScript recognizes the properties
      const identity = identityData as unknown as IdentityProfile;
      
      // Get owned vehicles
      const { data: vehiclesData, error: vehiclesError } = await this.client
        .from('vehicle_profiles')
        .select(`
          *,
          vehicle_media(*)
        `)
        .eq('owner_id', identity.id);
      
      if (vehiclesError) throw vehiclesError;
      
      // Combine all data
      return {
        ...identity,
        vehicles: vehiclesData as VehicleProfile[] || []
      } as CompleteIdentityProfile;
    } catch (error) {
      console.error('Error fetching complete identity profile:', error);
      return null;
    }
  }
  
  /**
   * Get a complete identity profile with owned vehicles by wallet address
   * @param walletAddress The wallet address
   * @returns The complete identity profile or null if not found
   */
  async getCompleteProfileByWalletAddress(walletAddress: string): Promise<CompleteIdentityProfile | null> {
    try {
      const normalizedWallet = walletAddress.toLowerCase();
      
      // Get the identity profile
      const { data: identityData, error } = await this.client
        .from('identity_registry')
        .select('*')
        .eq('normalized_wallet', normalizedWallet)
        .maybeSingle();
      
      if (error) throw error;
      if (!identityData) return null;
      
      // Cast to IdentityProfile to ensure TypeScript recognizes the properties
      const identity = identityData as unknown as IdentityProfile;
      
      // Get owned vehicles by owner_id
      const { data: vehiclesByOwnerId, error: ownerVehiclesError } = await this.client
        .from('vehicle_profiles')
        .select(`
          *,
          vehicle_media(*)
        `)
        .eq('owner_id', identity.id);
      
      if (ownerVehiclesError) throw ownerVehiclesError;
      
      // Use the vehicles from the owner_id query
      const uniqueVehicles = vehiclesByOwnerId || [];
      
      // Combine all data
      return {
        ...identity,
        vehicles: uniqueVehicles as VehicleProfile[] || []
      } as CompleteIdentityProfile;
    } catch (error) {
      console.error('Error fetching complete identity profile by wallet:', error);
      return null;
    }
  }
  
  /**
   * Search for identity profiles
   * @param options Search options
   * @returns Array of identity profiles
   */
  async search(options: IdentitySearchOptions = {}): Promise<IdentityProfile[]> {
    try {
      let query = this.client
        .from('identity_registry')
        .select('*');
      
      // Apply filters
      if (options.wallet_address) {
        query = query.eq('wallet_address', options.wallet_address);
      }
      
      if (options.normalized_wallet) {
        query = query.eq('normalized_wallet', options.normalized_wallet.toLowerCase());
      }
      
      if (options.username) {
        query = query.ilike('username', `%${options.username}%`);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? false 
        });
      } else {
        // Default ordering by created_at desc
        query = query.order('created_at', { ascending: false });
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as IdentityProfile[];
    } catch (error) {
      console.error('Error searching identity profiles:', error);
      return [];
    }
  }
  
  /**
   * Create a new identity profile
   * @param data The identity profile data
   * @returns The created identity profile
   */
  async createIdentityProfile(data: Partial<IdentityProfile>): Promise<IdentityProfile> {
    try {
      // Ensure wallet_address is normalized
      if (data.wallet_address) {
        data.normalized_wallet = data.wallet_address.toLowerCase();
      }
      
      // Insert the new identity profile
      const { data: newIdentity, error } = await this.client
        .from('identity_registry')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return newIdentity as IdentityProfile;
    } catch (error) {
      console.error('Error creating identity profile:', error);
      throw error;
    }
  }
  
  /**
   * Check if a username is available
   * @param username The username to check
   * @returns True if the username is available, false otherwise
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('identity_registry')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      return !data; // Username is available if no data is returned
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const identityProfileRepository = new IdentityProfileRepository();