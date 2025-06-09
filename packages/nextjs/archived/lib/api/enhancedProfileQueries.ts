import { getSupabaseClient } from '../supabase';
import { userProfiles } from './profileQueries';
import type {
  UserProfileStats
} from '../types/profiles';
import type {
  EnhancedUserProfile,
  IdentityRegistryEntry
} from '../types/enhancedProfiles';

// Helper function to get Supabase client
function getClient(useServiceRole = true) {
  const client = getSupabaseClient(useServiceRole);
  if (!client) {
    throw new Error('Failed to get Supabase client. Check your environment variables.');
  }
  return client;
}

/**
 * Enhanced User Profile API Functions
 * Uses the Identity Registry for lookups
 */
export const enhancedUserProfiles = {
  /**
   * Get a user profile by wallet address
   * Uses the Identity Registry for lookup if available
   */
  async getByWalletAddress(walletAddress: string): Promise<EnhancedUserProfile | null> {
    try {
      const client = getClient();
      
      // Convert wallet address to lowercase for consistent lookup
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Check if the identity_registry table exists
      let tableExists = null;
      let tableCheckError = null;
      
      try {
        const result = await client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'identity_registry')
          .single();
        
        tableExists = result.data;
        tableCheckError = result.error;
      } catch {
        tableCheckError = { message: 'Table check failed' };
      }
      
      // If the identity_registry table doesn't exist or there was an error checking,
      // fall back to the original implementation
      if (tableCheckError || !tableExists) {
        console.log('Identity registry table not found, using original implementation');
        return userProfiles.getByWalletAddress(walletAddress);
      }
      
      // Look up the user in the identity registry
      const { data: identity, error: identityError } = await client
        .from('identity_registry')
        .select('user_id, ens_name')
        .eq('normalized_wallet', normalizedAddress)
        .maybeSingle();
      
      const identityEntry = identity as IdentityRegistryEntry | null;
      
      if (identityError) {
        console.error('Error looking up identity:', identityError);
        // Fall back to the original implementation
        return userProfiles.getByWalletAddress(walletAddress);
      }
      
      if (!identity || !identity.user_id) {
        // No identity found or no user_id associated, fall back to the original implementation
        return userProfiles.getByWalletAddress(walletAddress);
      }
      
      // Get the user profile by user_id
      const { data, error } = await client
        .from('users')
        .select(`
          *,
          social_links(*)
        `)
        .eq('id', identity.user_id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile by user_id:', error);
        // Fall back to the original implementation
        return userProfiles.getByWalletAddress(walletAddress);
      }
      
      if (!data) return null;
      
      // Format the response to match our EnhancedUserProfile type
      return {
        id: data.id,
        wallet_address: data.wallet_address,
        username: data.username,
        display_name: data.display_name || (identityEntry?.ens_name || `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`),
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_image_url: data.banner_image_url,
        email: data.email,
        user_type: data.user_type,
        subscription_tier: data.subscription_tier,
        subscription_start_date: data.subscription_start_date,
        subscription_end_date: data.subscription_end_date,
        social_links: data.social_links || [],
        location: data.location,
        created_at: data.created_at,
        updated_at: data.updated_at,
        // Add ENS name from identity registry if available
        ens_name: identityEntry?.ens_name
      };
    } catch (error) {
      console.error('Error in enhanced getByWalletAddress:', error);
      // Fall back to the original implementation
      return userProfiles.getByWalletAddress(walletAddress);
    }
  },
  
  /**
   * Get a user profile by username
   * Uses the original implementation
   */
  async getByUsername(username: string): Promise<EnhancedUserProfile | null> {
    return userProfiles.getByUsername(username);
  },
  
  /**
   * Update a user profile
   * Also updates the identity registry if available
   */
  async update(walletAddress: string, data: Partial<EnhancedUserProfile>): Promise<boolean> {
    try {
      // First update the user profile using the original implementation
      const result = await userProfiles.update(walletAddress, data);
      
      // Then update the identity registry if it exists
      const client = getClient(true);
      
      // Convert wallet address to lowercase for consistent lookup
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Check if the identity_registry table exists
      let tableExists = null;
      let tableCheckError = null;
      
      try {
        const result = await client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'identity_registry')
          .single();
        
        tableExists = result.data;
        tableCheckError = result.error;
      } catch {
        tableCheckError = { message: 'Table check failed' };
      }
      
      // If the identity_registry table doesn't exist or there was an error checking,
      // just return the result from the original implementation
      if (tableCheckError || !tableExists) {
        return result;
      }
      
      // Get the user ID
      const { data: userData, error: userError } = await client
        .from('users')
        .select('id')
        .eq('wallet_address', normalizedAddress)
        .single();
      
      if (userError) {
        console.error('Error getting user ID:', userError);
        return result;
      }
      
      // Check if the wallet is already in the identity registry
      const { data: identity, error: identityError } = await client
        .from('identity_registry')
        .select('*')
        .eq('normalized_wallet', normalizedAddress)
        .maybeSingle();
      
      if (identityError && identityError.code !== 'PGRST116') {
        console.error('Error checking identity registry:', identityError);
        return result;
      }
      
      // Update or insert the identity registry entry
      if (identity) {
        // Update the existing entry
        const { error: updateError } = await client
          .from('identity_registry')
          .update({
            user_id: userData.id,
            ens_name: (data as any).ens_name || identity.ens_name,
            last_login: new Date().toISOString()
          })
          .eq('id', identity.id);
        
        if (updateError) {
          console.error('Error updating identity registry:', updateError);
        }
      } else {
        // Insert a new entry
        const { error: insertError } = await client
          .from('identity_registry')
          .insert({
            wallet_address: walletAddress,
            normalized_wallet: normalizedAddress,
            user_id: userData.id,
            ens_name: (data as any).ens_name
          });
        
        if (insertError) {
          console.error('Error inserting into identity registry:', insertError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in enhanced update:', error);
      // Fall back to the original implementation
      return userProfiles.update(walletAddress, data);
    }
  },
  
  /**
   * Get user profile stats
   * Uses the original implementation
   */
  async getStats(userId: string): Promise<UserProfileStats> {
    return userProfiles.getStats(userId);
  },
  
  /**
   * Check if username is available
   * Uses the original implementation
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    return userProfiles.isUsernameAvailable(username);
  },
  
  /**
   * Get all wallets associated with a user ID
   * This is a new function that uses the identity registry
   */
  async getWalletsByUserId(userId: string): Promise<string[]> {
    try {
      const client = getClient();
      
      // Check if the identity_registry table exists
      let tableExists = null;
      let tableCheckError = null;
      
      try {
        const result = await client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'identity_registry')
          .single();
        
        tableExists = result.data;
        tableCheckError = result.error;
      } catch {
        tableCheckError = { message: 'Table check failed' };
      }
      
      // If the identity_registry table doesn't exist or there was an error checking,
      // fall back to getting the wallet from the users table
      if (tableCheckError || !tableExists) {
        const { data: user, error: userError } = await client
          .from('users')
          .select('wallet_address')
          .eq('id', userId)
          .single();
        
        if (userError || !user) {
          return [];
        }
        
        return [user.wallet_address];
      }
      
      // Get all wallets associated with the user ID from the identity registry
      const { data: identities, error: identitiesError } = await client
        .from('identity_registry')
        .select('wallet_address')
        .eq('user_id', userId);
      
      if (identitiesError) {
        console.error('Error getting wallets by user ID:', identitiesError);
        return [];
      }
      
      return identities.map(identity => identity.wallet_address);
    } catch (error) {
      console.error('Error getting wallets by user ID:', error);
      return [];
    }
  },
  
  /**
   * Get the primary wallet for a user ID
   * This is a new function that uses the identity registry
   */
  async getPrimaryWalletByUserId(userId: string): Promise<string | null> {
    try {
      const client = getClient();
      
      // First try to get the wallet from the users table
      const { data: user, error: userError } = await client
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single();
      
      if (!userError && user && user.wallet_address) {
        return user.wallet_address;
      }
      
      // If that fails, try to get the wallet from the identity registry
      const { data: identities, error: identitiesError } = await client
        .from('identity_registry')
        .select('wallet_address')
        .eq('user_id', userId)
        .order('last_login', { ascending: false })
        .limit(1);
      
      if (identitiesError || !identities || identities.length === 0) {
        return null;
      }
      
      return identities[0].wallet_address;
    } catch (error) {
      console.error('Error getting primary wallet by user ID:', error);
      return null;
    }
  },

  /**
   * Register a wallet address in the identity registry
   * This should be called during profile creation
   * @param walletAddress The wallet address to register
   * @param userId The user ID to associate with the wallet address
   * @param ensName Optional ENS name for the wallet
   * @returns true if successful, false otherwise
   */
  async registerWallet(walletAddress: string, userId: string, ensName?: string): Promise<boolean> {
    try {
      const client = getClient(true);
      
      // Convert wallet address to lowercase for consistent lookup
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Check if the identity_registry table exists
      let tableExists = null;
      let tableCheckError = null;
      
      try {
        const result = await client
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'identity_registry')
          .single();
        
        tableExists = result.data;
        tableCheckError = result.error;
      } catch {
        tableCheckError = { message: 'Table check failed' };
      }
      
      // If the identity_registry table doesn't exist or there was an error checking,
      // just return success (we don't want to fail profile creation if the identity registry isn't available)
      if (tableCheckError || !tableExists) {
        console.log('Identity registry table not found, skipping wallet registration');
        return true;
      }
      
      // Check if the wallet is already in the identity registry
      const { data: identity, error: identityError } = await client
        .from('identity_registry')
        .select('*')
        .eq('normalized_wallet', normalizedAddress)
        .maybeSingle();
      
      if (identityError && identityError.code !== 'PGRST116') {
        console.error('Error checking identity registry:', identityError);
        return false;
      }
      
      // Update or insert the identity registry entry
      if (identity) {
        // Update the existing entry
        const { error: updateError } = await client
          .from('identity_registry')
          .update({
            user_id: userId,
            ens_name: ensName || identity.ens_name,
            last_login: new Date().toISOString()
          })
          .eq('id', identity.id);
        
        if (updateError) {
          console.error('Error updating identity registry:', updateError);
          return false;
        }
      } else {
        // Insert a new entry
        const { error: insertError } = await client
          .from('identity_registry')
          .insert({
            wallet_address: walletAddress,
            normalized_wallet: normalizedAddress,
            user_id: userId,
            ens_name: ensName,
            last_login: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error inserting into identity registry:', insertError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error registering wallet in identity registry:', error);
      return false;
    }
  }
};