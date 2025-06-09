import { SupabaseRepository } from './SupabaseRepository';
import { 
  VehicleProfile, 
  CompleteVehicleProfile, 
  VehicleSearchOptions 
} from '../models/VehicleProfile';

/**
 * Vehicle Profile Repository
 * Handles database operations for vehicle profiles
 */
export class VehicleProfileRepository extends SupabaseRepository<VehicleProfile, string> {
  constructor(useServiceRole = true) {
    super('vehicle_profiles', useServiceRole);
  }
  
  /**
   * Override the ID column name
   * For vehicle profiles, we often query by token_id instead of id
   */
  protected getIdColumn(): string {
    return 'token_id';
  }
  
  /**
   * Override the select query to include related data
   */
  protected getSelectQuery(): string {
    return `
      *,
      vehicle_media(*),
      vehicle_specifications(*),
      vehicle_links(*),
      vehicle_videos(*)
    `;
  }
  
  /**
   * Find a vehicle profile by token ID with complete related data
   * @param tokenId The token ID
   * @returns The complete vehicle profile or null if not found
   */
  async findByTokenId(tokenId: string): Promise<CompleteVehicleProfile | null> {
    try {
      // Get the vehicle profile with related data
      const { data: vehicleData, error } = await this.client
        .from('vehicle_profiles')
        .select(this.getSelectQuery())
        .eq('token_id', tokenId)
        .single();
      
      if (error) throw error;
      if (!vehicleData) return null;
      
      // Cast to VehicleProfile to ensure TypeScript recognizes the properties
      const vehicle = vehicleData as unknown as VehicleProfile & {
        vehicle_media: any[];
        vehicle_specifications: any[];
        vehicle_links: any[];
        vehicle_videos: any[];
      };
      
      // Get owner information from identity_registry
      let owner = null;
      if (vehicle.owner_id) {
        const { data: ownerData, error: ownerError } = await this.client
          .from('identity_registry')
          .select('*')
          .eq('id', vehicle.owner_id)
          .maybeSingle();
        
        if (ownerError) throw ownerError;
        owner = ownerData;
      }
      
      // Get parts
      const { data: parts, error: partsError } = await this.client
        .from('parts')
        .select('*')
        .eq('vehicle_id', vehicle.id);
      
      if (partsError) throw partsError;
      
      // Combine all data
      return {
        ...vehicle,
        owner: owner || undefined,
        parts: parts || [],
      } as CompleteVehicleProfile;
    } catch (error) {
      console.error('Error fetching complete vehicle profile:', error);
      return null;
    }
  }
  
  /**
   * Search for vehicles with filters
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  async search(options: VehicleSearchOptions = {}): Promise<CompleteVehicleProfile[]> {
    try {
      // First, get the vehicle profiles
      let query = this.client
        .from('vehicle_profiles')
        .select(this.getSelectQuery());
      
      // Apply filters
      if (options.make) query = query.ilike('make', `%${options.make}%`);
      if (options.model) query = query.ilike('model', `%${options.model}%`);
      if (options.year) query = query.eq('year', options.year);
      
      
      if (options.owner_id) {
        query = query.eq('owner_id', options.owner_id);
      }
      
      // Apply pagination
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      
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
      const { data: vehiclesData, error } = await query;
      
      if (error) throw error;
      
      // If no vehicles found, return empty array
      if (!vehiclesData || vehiclesData.length === 0) {
        return [];
      }
      
      // Cast to VehicleProfile[] to ensure TypeScript recognizes the properties
      const vehicles = vehiclesData as unknown as (VehicleProfile & {
        vehicle_media: any[];
        vehicle_specifications: any[];
        vehicle_links: any[];
        vehicle_videos: any[];
      })[];
      
      // Get all unique owner IDs
      const ownerIds = [...new Set(vehicles
        .map(v => v.owner_id)
        .filter(Boolean) as string[])];
      
      // Get owner information for all vehicles in a single query
      let owners: Record<string, any> = {};
      if (ownerIds.length > 0) {
        const { data: ownersData, error: ownersError } = await this.client
          .from('identity_registry')
          .select('*')
          .in('id', ownerIds);
        
        if (ownersError) throw ownersError;
        
        if (ownersData) {
          // Create a map of owner ID to owner data
          owners = ownersData.reduce((acc, owner) => {
            if (owner.id) {
              acc[owner.id] = owner;
            }
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      // Combine vehicle data with owner data
      const completeVehicles = vehicles.map(vehicle => {
        return {
          ...vehicle,
          owner: vehicle.owner_id ? owners[vehicle.owner_id] : undefined
        };
      });
      
      return completeVehicles as CompleteVehicleProfile[];
    } catch (error) {
      console.error('Error searching vehicles:', error);
      return [];
    }
  }
  
  /**
   * Update a vehicle profile by token ID
   * @param tokenId The token ID
   * @param data The updated vehicle data
   * @returns The updated vehicle profile or null if not found
   */
  async updateByTokenId(tokenId: string, data: Partial<VehicleProfile>): Promise<VehicleProfile | null> {
    try {
      // Extract only the fields that belong to the vehicle_profiles table
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_media,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_specifications,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_links,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_videos,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        parts,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        owner,
        ...vehicleData
      } = data as any;
      
      // Update the vehicle profile
      const { data: updatedVehicle, error } = await this.client
        .from('vehicle_profiles')
        .update(vehicleData)
        .eq('token_id', tokenId)
        .select()
        .single();
      
      if (error) throw error;
      return updatedVehicle as VehicleProfile;
    } catch (error) {
      console.error('Error updating vehicle profile:', error);
      return null;
    }
  }
  
  /**
   * Create a new vehicle profile
   * @param data The vehicle profile data
   * @returns The created vehicle profile
   */
  async createVehicleProfile(data: Partial<VehicleProfile>): Promise<VehicleProfile> {
    try {
      // Extract only the fields that belong to the vehicle_profiles table
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_media,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_specifications,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_links,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        vehicle_videos,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        parts,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        owner,
        ...vehicleData
      } = data as any;
      
      
      // Insert the new vehicle profile
      const { data: newVehicle, error } = await this.client
        .from('vehicle_profiles')
        .insert([vehicleData])
        .select()
        .single();
      
      if (error) throw error;
      return newVehicle as VehicleProfile;
    } catch (error) {
      console.error('Error creating vehicle profile:', error);
      throw error;
    }
  }
  
  /**
   * Get vehicles owned by a specific wallet address
   * @param walletAddress The wallet address
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  /**
   * Get vehicles owned by a specific wallet address by first finding the identity
   * @param walletAddress The wallet address
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  async getVehiclesByOwnerWallet(
    walletAddress: string,
    options: Omit<VehicleSearchOptions, 'owner_id'> = {}
  ): Promise<CompleteVehicleProfile[]> {
    try {
      const normalizedWallet = walletAddress.toLowerCase();
      
      // First, find the identity for this wallet
      const { data: identity, error: identityError } = await this.client
        .from('identity_registry')
        .select('id')
        .eq('normalized_wallet', normalizedWallet)
        .maybeSingle();
      
      if (identityError) throw identityError;
      
      // If no identity found, return empty array
      if (!identity) {
        return [];
      }
      
      // Get vehicles by owner ID
      return this.getVehiclesByOwnerId(identity.id, options);
    } catch (error) {
      console.error('Error getting vehicles by owner wallet:', error);
      return [];
    }
  }
  
  /**
   * Get vehicles owned by a specific identity
   * @param ownerId The owner ID (identity_registry.id)
   * @param options Search options
   * @returns Array of vehicle profiles
   */
  async getVehiclesByOwnerId(
    ownerId: string,
    options: Omit<VehicleSearchOptions, 'owner_id'> = {}
  ): Promise<CompleteVehicleProfile[]> {
    return this.search({
      ...options,
      owner_id: ownerId
    });
  }
}

// Export a singleton instance
export const vehicleProfileRepository = new VehicleProfileRepository();