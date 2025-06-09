import { vehicleService } from './VehicleService';
import { SupabaseRepository } from '../repositories/SupabaseRepository';
import { identityProfileRepository } from '../repositories/IdentityProfileRepository';
import { vehicleProfiles } from '../api/vehicles';
import { getSupabaseClient } from '../supabase';

/**
 * Blockchain Event Types
 */
export enum BlockchainEventType {
  TRANSFER = 'transfer',
  MINT = 'mint',
  BURN = 'burn'
}

/**
 * Blockchain Event Status
 */
export enum BlockchainEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Blockchain Event
 */
export interface BlockchainEvent {
  id: string;
  event_type: BlockchainEventType;
  token_id: number;
  from_address: string | null;
  to_address: string;
  transaction_hash: string;
  status: BlockchainEventStatus;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
}

/**
 * Blockchain Event Repository
 */
class BlockchainEventRepository extends SupabaseRepository<BlockchainEvent, string> {
  constructor() {
    super('blockchain_events', true);
  }
  
  /**
   * Check if the blockchain_events table exists
   * @returns True if the table exists, false otherwise
   */
  async checkTableExists(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('blockchain_events')
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log('blockchain_events table does not exist');
          return false;
        }
        console.error('Error checking if blockchain_events table exists:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking if blockchain_events table exists:', error);
      return false;
    }
  }

  /**
   * Get pending events
   * @param limit Maximum number of events to retrieve
   * @returns Array of pending events
   */
  async getPendingEvents(limit = 10): Promise<BlockchainEvent[]> {
    try {
      // Check if the table exists
      const tableExists = await this.checkTableExists();
      if (!tableExists) {
        console.log('Skipping pending events check because blockchain_events table does not exist');
        return [];
      }
      
      const { data, error } = await this.client
        .from('blockchain_events')
        .select('*')
        .eq('status', BlockchainEventStatus.PENDING)
        .order('created_at', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return (data || []) as BlockchainEvent[];
    } catch (error) {
      console.error('Error getting pending events:', error);
      return [];
    }
  }
  
  /**
   * Update event status
   * @param id Event ID
   * @param status New status
   * @param error Error message (if any)
   * @returns Updated event or null if not found
   */
  async updateEventStatus(
    id: string, 
    status: BlockchainEventStatus, 
    error?: string
  ): Promise<BlockchainEvent | null> {
    try {
      const updateData: Partial<BlockchainEvent> = {
        status,
        processed_at: status === BlockchainEventStatus.COMPLETED || 
                      status === BlockchainEventStatus.FAILED 
                      ? new Date().toISOString() 
                      : null
      };
      
      if (error) {
        updateData.last_error = error;
        
        // Increment retry count
        await this.client.rpc('increment_retry_count', { event_id: id });
        
        // Get the updated retry count
        const { data: updatedEvent } = await this.client
          .from('blockchain_events')
          .select('retry_count')
          .eq('id', id)
          .single();
          
        if (updatedEvent) {
          updateData.retry_count = updatedEvent.retry_count;
        }
      }
      
      const { data, error: updateError } = await this.client
        .from('blockchain_events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return data as BlockchainEvent;
    } catch (error) {
      console.error('Error updating event status:', error);
      return null;
    }
  }
  
  /**
   * Create a new blockchain event
   * @param event Event data
   * @returns Created event
   */
  async createEvent(event: Omit<BlockchainEvent, 'id' | 'created_at' | 'processed_at' | 'retry_count' | 'last_error' | 'status'>): Promise<BlockchainEvent> {
    try {
      // Check if the table exists
      const tableExists = await this.checkTableExists();
      if (!tableExists) {
        console.log('Skipping event creation because blockchain_events table does not exist');
        // Return a dummy event
        return {
          id: 'dummy-id',
          event_type: event.event_type,
          token_id: event.token_id,
          from_address: event.from_address,
          to_address: event.to_address,
          transaction_hash: event.transaction_hash,
          status: BlockchainEventStatus.PENDING,
          retry_count: 0,
          last_error: null,
          created_at: new Date().toISOString(),
          processed_at: null
        };
      }
      
      const eventData = {
        ...event,
        status: BlockchainEventStatus.PENDING,
        retry_count: 0,
        last_error: null
      };
      
      const { data, error } = await this.client
        .from('blockchain_events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      return data as BlockchainEvent;
    } catch (error) {
      console.error('Error creating blockchain event:', error);
      // Return a dummy event instead of throwing
      return {
        id: 'dummy-id',
        event_type: event.event_type,
        token_id: event.token_id,
        from_address: event.from_address,
        to_address: event.to_address,
        transaction_hash: event.transaction_hash,
        status: BlockchainEventStatus.PENDING,
        retry_count: 0,
        last_error: null,
        created_at: new Date().toISOString(),
        processed_at: null
      };
    }
  }
}

/**
 * Blockchain Event Service
 * Handles blockchain events such as NFT transfers
 */
export class BlockchainEventService {
  private repository = new BlockchainEventRepository();
  
  /**
   * Process a transfer event
   * @param tokenId The token ID
   * @param fromAddress The sender address
   * @param toAddress The recipient address
   * @param transactionHash The transaction hash
   * @returns The created event
   */
  async processTransferEvent(
    tokenId: number,
    fromAddress: string | null,
    toAddress: string,
    transactionHash: string
  ): Promise<BlockchainEvent> {
    try {
      // Create a new blockchain event
      const event = await this.repository.createEvent({
        event_type: BlockchainEventType.TRANSFER,
        token_id: tokenId,
        from_address: fromAddress,
        to_address: toAddress,
        transaction_hash: transactionHash
      });
      
      // Process the event immediately
      await this.processEvent(event);
      
      return event;
    } catch (error) {
      console.error('Error processing transfer event:', error);
      // Log the error but don't re-throw it, so the process can continue
      console.log(`Continuing despite error processing transfer event for token ID ${tokenId}`);
      // Return a dummy event
      return {
        id: 'dummy-id',
        event_type: BlockchainEventType.TRANSFER,
        token_id: tokenId,
        from_address: fromAddress,
        to_address: toAddress,
        transaction_hash: transactionHash,
        status: BlockchainEventStatus.FAILED,
        retry_count: 0,
        last_error: error instanceof Error ? error.message : String(error),
        created_at: new Date().toISOString(),
        processed_at: null
      };
    }
  }
  
  /**
   * Process a mint event
   * @param tokenId The token ID
   * @param toAddress The recipient address
   * @param transactionHash The transaction hash
   * @returns The created event
   */
  async processMintEvent(
    tokenId: number,
    toAddress: string,
    transactionHash: string
  ): Promise<BlockchainEvent> {
    try {
      // Create a new blockchain event
      const event = await this.repository.createEvent({
        event_type: BlockchainEventType.MINT,
        token_id: tokenId,
        from_address: null, // Mint events have no sender
        to_address: toAddress,
        transaction_hash: transactionHash
      });
      
      // Process the event immediately
      await this.processEvent(event);
      
      return event;
    } catch (error) {
      console.error('Error processing mint event:', error);
      // Log the error but don't re-throw it, so the process can continue
      console.log(`Continuing despite error processing mint event for token ID ${tokenId}`);
      // Return a dummy event
      return {
        id: 'dummy-id',
        event_type: BlockchainEventType.MINT,
        token_id: tokenId,
        from_address: null,
        to_address: toAddress,
        transaction_hash: transactionHash,
        status: BlockchainEventStatus.FAILED,
        retry_count: 0,
        last_error: error instanceof Error ? error.message : String(error),
        created_at: new Date().toISOString(),
        processed_at: null
      };
    }
  }
  
  /**
   * Process a burn event
   * @param tokenId The token ID
   * @param fromAddress The sender address
   * @param transactionHash The transaction hash
   * @returns The created event
   */
  async processBurnEvent(
    tokenId: number,
    fromAddress: string,
    transactionHash: string
  ): Promise<BlockchainEvent> {
    try {
      // Create a new blockchain event
      const event = await this.repository.createEvent({
        event_type: BlockchainEventType.BURN,
        token_id: tokenId,
        from_address: fromAddress,
        to_address: '0x0000000000000000000000000000000000000000', // Burn address
        transaction_hash: transactionHash
      });
      
      // Process the event immediately
      await this.processEvent(event);
      
      return event;
    } catch (error) {
      console.error('Error processing burn event:', error);
      // Log the error but don't re-throw it, so the process can continue
      console.log(`Continuing despite error processing burn event for token ID ${tokenId}`);
      // Return a dummy event
      return {
        id: 'dummy-id',
        event_type: BlockchainEventType.BURN,
        token_id: tokenId,
        from_address: fromAddress,
        to_address: '0x0000000000000000000000000000000000000000', // Burn address
        transaction_hash: transactionHash,
        status: BlockchainEventStatus.FAILED,
        retry_count: 0,
        last_error: error instanceof Error ? error.message : String(error),
        created_at: new Date().toISOString(),
        processed_at: null
      };
    }
  }
  
  /**
   * Process pending events
   * @param limit Maximum number of events to process
   * @returns Number of events processed
   */
  async processPendingEvents(limit = 10): Promise<number> {
    try {
      // Get pending events
      const pendingEvents = await this.repository.getPendingEvents(limit);
      
      // Process each event
      let processedCount = 0;
      for (const event of pendingEvents) {
        try {
          await this.processEvent(event);
          processedCount++;
        } catch (error) {
          console.error(`Error processing event ${event.id}:`, error);
          // Update event status to failed
          await this.repository.updateEventStatus(
            event.id, 
            BlockchainEventStatus.FAILED, 
            error instanceof Error ? error.message : String(error)
          );
        }
      }
      
      return processedCount;
    } catch (error) {
      console.error('Error processing pending events:', error);
      return 0;
    }
  }
  
  /**
   * Process a single event
   * @param event The event to process
   */
  private async processEvent(event: BlockchainEvent): Promise<void> {
    try {
      // Skip updating event status if it's a dummy event
      if (event.id !== 'dummy-id') {
        // Update event status to processing
        await this.repository.updateEventStatus(event.id, BlockchainEventStatus.PROCESSING);
      }
      
      // Process the event based on its type
      switch (event.event_type) {
        case BlockchainEventType.TRANSFER:
          // Handle transfer event
          if (event.to_address) {
            await vehicleService.handleOwnershipTransfer(
              event.token_id.toString(), 
              event.to_address
            );
          }
          break;
          
        case BlockchainEventType.MINT:
          // Handle mint event - create a new vehicle profile
          try {
            // Get the token ID and owner wallet from the event
            const tokenId = event.token_id.toString();
            const ownerWallet = event.to_address;
            
            // Check if a vehicle profile already exists for this token ID
            const existingVehicle = await vehicleService.getVehicleByTokenId(tokenId);
            
            if (existingVehicle) {
              console.log(`Vehicle profile already exists for token ID ${tokenId}`);
            } else {
              // Check if the wallet has an identity in the identity registry
              const identity = await identityProfileRepository.findByWalletAddress(ownerWallet);
              
              if (!identity) {
                console.warn(`No identity found for wallet ${ownerWallet} in identity registry. Vehicle profile creation skipped.`);
                // We'll skip creating the vehicle profile since the user doesn't have an identity
                // This maintains the requirement that users must create a profile before minting
              } else {
                console.log(`Creating vehicle profile for token ID ${tokenId} with identity ID ${identity.id}`);
                
                // Check if we have metadata from the mint-confirm API
                let vehicleProfileData: any = {
                  token_id: tokenId,
                  owner_id: identity.id,
                };
                
                // Get the Supabase client to check for metadata with better error handling
                const client = getSupabaseClient(true);
                if (!client) {
                  console.error(`Failed to get Supabase client for token ID ${tokenId}`);
                  console.error('Check that environment variables are properly set:');
                  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
                  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
                }
                if (client) {
                  try {
                    // Get the event from the database to check for metadata
                    const { data: eventData, error: eventError } = await client
                      .from('blockchain_events')
                      .select('metadata')
                      .eq('token_id', event.token_id)
                      .eq('event_type', BlockchainEventType.MINT)
                      .eq('transaction_hash', event.transaction_hash)
                      .maybeSingle();
                    
                    if (eventError) {
                      console.error(`Error getting event metadata for token ID ${tokenId}:`, eventError);
                    } else if (eventData && eventData.metadata && eventData.metadata.vehicleData) {
                      // Use the metadata from the mint-confirm API
                      const { vehicleData } = eventData.metadata;
                      console.log(`Found metadata for token ID ${tokenId}:`, vehicleData);
                      
                      // Update the vehicle profile data with the metadata
                      vehicleProfileData = {
                        ...vehicleProfileData,
                        name: vehicleData.name || `Vehicle #${tokenId}`,
                        description: vehicleData.description || `Vehicle #${tokenId} minted by ${ownerWallet}`,
                        vin: vehicleData.vin || `AUTO-GENERATED-${tokenId}`,
                        make: vehicleData.make || 'Unknown',
                        model: vehicleData.model || 'Unknown',
                        year: vehicleData.year || new Date().getFullYear(),
                      };
                      
                      // If we have an image, save it to the vehicle_media table
                      if (vehicleData.imageData) {
                        console.log(`Found image data for token ID ${tokenId}, will save it after creating the profile`);
                      }
                    } else {
                      console.log(`No metadata found for token ID ${tokenId}, using default values`);
                      
                      // Use default values
                      vehicleProfileData = {
                        ...vehicleProfileData,
                        name: `Vehicle #${tokenId}`,
                        description: `Vehicle #${tokenId} minted by ${ownerWallet}`,
                        vin: `AUTO-GENERATED-${tokenId}`,
                        make: 'Unknown',
                        model: 'Unknown',
                        year: new Date().getFullYear(),
                      };
                    }
                  } catch (metadataError) {
                    console.error(`Error getting metadata for token ID ${tokenId}:`, metadataError);
                    
                    // Use default values
                    vehicleProfileData = {
                      ...vehicleProfileData,
                      name: `Vehicle #${tokenId}`,
                      description: `Vehicle #${tokenId} minted by ${ownerWallet}`,
                      vin: `AUTO-GENERATED-${tokenId}`,
                      make: 'Unknown',
                      model: 'Unknown',
                      year: new Date().getFullYear(),
                    };
                  }
                } else {
                  console.warn(`No Supabase client available, using default values for token ID ${tokenId}`);
                  
                  // Use default values
                  vehicleProfileData = {
                    ...vehicleProfileData,
                    name: `Vehicle #${tokenId}`,
                    description: `Vehicle #${tokenId} minted by ${ownerWallet}`,
                    vin: `AUTO-GENERATED-${tokenId}`,
                    make: 'Unknown',
                    model: 'Unknown',
                    year: new Date().getFullYear(),
                  };
                }
                
                // Create the vehicle profile with better error handling
                let createdVehicle = null;
                try {
                  console.log(`Attempting to create vehicle profile with data:`, JSON.stringify(vehicleProfileData, null, 2));
                  createdVehicle = await vehicleService.createVehicle(vehicleProfileData, ownerWallet);
                  console.log(`Successfully created vehicle profile for token ID ${tokenId}`);
                } catch (createError) {
                  console.error(`Error in createVehicle call for token ID ${tokenId}:`);
                  if (createError instanceof Error) {
                    console.error(`Error name: ${createError.name}`);
                    console.error(`Error message: ${createError.message}`);
                    console.error(`Error stack: ${createError.stack}`);
                  } else {
                    console.error(`Non-Error object thrown:`, JSON.stringify(createError, null, 2));
                  }
                  throw createError; // Re-throw to be caught by the outer catch block
                }
                
                // Log the action
                await vehicleProfiles.logAction(
                  tokenId,
                  'blockchain_mint',
                  `Automatically created vehicle profile from blockchain event. Transaction hash: ${event.transaction_hash}`,
                  ownerWallet
                );
                
                // If we have image data and the vehicle was created successfully, save the image
                if (client && createdVehicle) {
                  try {
                    // Get the event from the database to check for metadata
                    const { data: eventData, error: eventError } = await client
                      .from('blockchain_events')
                      .select('metadata')
                      .eq('token_id', event.token_id)
                      .eq('event_type', BlockchainEventType.MINT)
                      .eq('transaction_hash', event.transaction_hash)
                      .maybeSingle();
                    
                    if (eventError) {
                      console.error(`Error getting event metadata for token ID ${tokenId}:`, eventError);
                    } else if (eventData && eventData.metadata && eventData.metadata.vehicleData && eventData.metadata.vehicleData.imageData) {
                      // Use the image data from the mint-confirm API
                      const { imageData } = eventData.metadata.vehicleData;
                      console.log(`Found image data for token ID ${tokenId}, saving to vehicle_media table`);
                      
                      try {
                        // Create a FormData object to pass to the addMedia function
                        const mediaFormData = new FormData();
                        
                        // Convert base64 image data to a file
                        const imageBlob = await fetch(imageData).then(r => r.blob());
                        const imageFile = new File([imageBlob], `${tokenId}.jpg`, { type: 'image/jpeg' });
                        
                        mediaFormData.append('file', imageFile);
                        mediaFormData.append('caption', vehicleProfileData.description);
                        mediaFormData.append('category', 'primary');
                        mediaFormData.append('is_featured', 'true');
                        
                        // Add the image to the vehicle_media table
                        const mediaResult = await vehicleProfiles.addMedia(tokenId.toString(), mediaFormData);
                        console.log(`Saved image for token ID ${tokenId} to vehicle_media table:`, mediaResult);
                      } catch (imageError) {
                        console.error(`Error saving image for token ID ${tokenId}:`, imageError);
                      }
                    }
                  } catch (metadataError) {
                    console.error(`Error getting metadata for token ID ${tokenId}:`, metadataError);
                  }
                }
              }
            }
          } catch (error) {
            // Improve error logging with more details
            console.error(`Error creating vehicle profile for token ID ${event.token_id}:`);
            
            if (error instanceof Error) {
              console.error(`Error name: ${error.name}`);
              console.error(`Error message: ${error.message}`);
              console.error(`Error stack: ${error.stack}`);
            } else {
              console.error(`Non-Error object thrown:`, JSON.stringify(error, null, 2));
            }
            
            // Log the error but don't throw it, so the process can continue
            console.log(`Continuing despite error creating vehicle profile for token ID ${event.token_id}`);
          }
          break;
          
        case BlockchainEventType.BURN:
          // Handle burn event
          // For burns, we might want to mark the vehicle as burned
          // This would typically be handled by a separate service
          break;
          
        default:
          throw new Error(`Unknown event type: ${event.event_type}`);
      }
      
      // Skip updating event status if it's a dummy event
      if (event.id !== 'dummy-id') {
        // Update event status to completed
        await this.repository.updateEventStatus(event.id, BlockchainEventStatus.COMPLETED);
      }
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      
      // Skip updating event status if it's a dummy event
      if (event.id !== 'dummy-id') {
        // Update event status to failed
        await this.repository.updateEventStatus(
          event.id,
          BlockchainEventStatus.FAILED,
          error instanceof Error ? error.message : String(error)
        );
      }
      
      // Log the error but don't re-throw it, so the process can continue
      console.log(`Continuing despite error processing event ${event.id}`);
    }
  }

  /**
   * Process a mint event on the server side
   * This method is called from an API route
   * @param tokenId The token ID
   * @param ownerWallet The owner wallet address
   * @param transactionHash The transaction hash
   * @param vehicleData The vehicle data
   * @param identityId Optional identity ID
   * @returns The created vehicle profile
   */
  async processMintEventServerSide(
    tokenId: number,
    ownerWallet: string,
    transactionHash: string,
    vehicleData: any,
    identityId?: string
  ): Promise<any> {
    try {
      // Normalize the wallet address
      const normalizedWallet = ownerWallet.toLowerCase();
      
      // Check if a vehicle profile already exists
      const existingVehicle = await vehicleService.getVehicleByTokenId(tokenId.toString());
      
      if (existingVehicle) {
        console.log(`Vehicle profile already exists for token ID ${tokenId}`);
        return existingVehicle;
      }
      
      // Check if the wallet has an identity
      let identity;
      if (identityId) {
        // If we have an identity ID, use it
        console.log(`Using provided identity ID: ${identityId}`);
        identity = { id: identityId };
      } else {
        // Otherwise, look up the identity by wallet address
        identity = await identityProfileRepository.findByWalletAddress(normalizedWallet);
        
        if (!identity) {
          throw new Error(`No identity found for wallet ${normalizedWallet}`);
        }
      }
      
      // Create the vehicle profile
      const vehicleProfileData = {
        token_id: tokenId.toString(),
        owner_id: identity.id,
        owner_wallet: normalizedWallet, // Add the owner wallet field
        name: vehicleData.name || `Vehicle #${tokenId}`,
        description: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`,
        vin: vehicleData.vin || `AUTO-GENERATED-${tokenId}`,
        make: vehicleData.make || 'Unknown',
        model: vehicleData.model || 'Unknown',
        year: parseInt(vehicleData.year) || new Date().getFullYear(),
        image_url: vehicleData.image_url
      };
      
      // Create the vehicle profile
      const createdVehicle = await vehicleService.createVehicle(vehicleProfileData, normalizedWallet);
      
      // If we have an image URL, create a media record
      if (vehicleData.image_url && createdVehicle.id) {
        const supabase = getSupabaseClient(true);
        if (supabase) {
          await supabase
            .from('vehicle_media')
            .insert([
              {
                vehicle_id: createdVehicle.id,
                url: vehicleData.image_url,
                type: 'image',
                caption: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`,
                category: 'primary',
                is_featured: true
              }
            ]);
        }
      }
      
      return createdVehicle;
    } catch (error) {
      console.error(`Error processing mint event on server side for token ID ${tokenId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const blockchainEventService = new BlockchainEventService();