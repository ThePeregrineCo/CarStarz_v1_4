import { getSupabaseClient } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Identity Service
 * 
 * This service provides a unified interface for identity-related operations.
 * It uses the Identity Registry as the source of truth for identity information,
 * while maintaining compatibility with the existing Burner Wallet system.
 * 
 * The service is designed to be used with both Burner Wallets (in development)
 * and SIWE (in production) without changing the API.
 * 
 * It also abstracts away wallet addresses with human-readable usernames.
 */

// Environment flag to determine whether to use Burner Wallets or SIWE
// This will be set to true for production
const USE_SIWE = process.env.NEXT_PUBLIC_USE_SIWE === 'true';

/**
 * User identity information
 */
export interface UserIdentity {
  id: string;
  walletAddress: string;
  normalizedWallet: string;
  username: string;
  displayName: string;
  profileImage?: string;
  ensName?: string;
  did?: string;
  lastLogin?: string;
}

/**
 * Get a user by wallet address
 * @param walletAddress The wallet address to look up
 * @returns The user identity information
 */
export async function getUserByWallet(walletAddress: string): Promise<UserIdentity | null> {
  try {
    // Normalize the wallet address
    const normalizedWallet = walletAddress.toLowerCase();
    
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[IDENTITY] Supabase client not available');
      return null;
    }
    
    // Check if the identity_registry table exists by trying to query it directly
    try {
      const { error: tableCheckError } = await supabase
        .from('identity_registry')
        .select('count(*)', { count: 'exact', head: true });
      
      // If the identity_registry table doesn't exist yet, fall back to the users table
      if (tableCheckError) {
        console.log('[IDENTITY] Identity registry table does not exist yet, falling back to users table');
        return getUserByWalletLegacy(supabase, normalizedWallet);
      }
    } catch (error) {
      console.error('[IDENTITY] Error checking if identity_registry table exists:', error);
      return getUserByWalletLegacy(supabase, normalizedWallet);
    }
    
    // Look up the user in the identity registry
    const { data: identity, error: identityError } = await supabase
      .from('identity_registry')
      .select(`
        *,
        user:users(*)
      `)
      .eq('normalized_wallet', normalizedWallet)
      .maybeSingle();
    
    if (identityError) {
      console.error('[IDENTITY] Error looking up identity:', identityError);
      // Fall back to the users table
      return getUserByWalletLegacy(supabase, normalizedWallet);
    }
    
    if (!identity || !identity.user) {
      console.log(`[IDENTITY] No identity found for wallet ${normalizedWallet}, falling back to users table`);
      return getUserByWalletLegacy(supabase, normalizedWallet);
    }
    
    // Return the user identity information
    return {
      id: identity.user.id,
      walletAddress: identity.wallet_address,
      normalizedWallet: identity.normalized_wallet,
      username: identity.user.username || `user_${identity.normalized_wallet.substring(2, 8)}`,
      displayName: identity.user.display_name || identity.user.username || formatWalletAddress(identity.wallet_address),
      profileImage: identity.user.profile_image_url,
      ensName: identity.ens_name,
      did: identity.did,
      lastLogin: identity.last_login
    };
  } catch (error) {
    console.error('[IDENTITY] Error getting user by wallet:', error);
    return null;
  }
}

/**
 * Legacy function to get a user by wallet address directly from the users table
 * This is used as a fallback when the identity registry is not available
 * @param supabase The Supabase client
 * @param normalizedWallet The normalized wallet address
 * @returns The user identity information
 */
async function getUserByWalletLegacy(supabase: SupabaseClient<Database>, normalizedWallet: string): Promise<UserIdentity | null> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedWallet)
      .maybeSingle();
    
    if (userError) {
      console.error('[IDENTITY] Error looking up user:', userError);
      return null;
    }
    
    if (!user) {
      return null;
    }
    
    // Return the user identity information
    return {
      id: user.id,
      walletAddress: user.wallet_address,
      normalizedWallet: user.wallet_address.toLowerCase(),
      username: user.username || `user_${normalizedWallet.substring(2, 8)}`,
      displayName: user.display_name || user.username || formatWalletAddress(user.wallet_address),
      profileImage: user.profile_image_url
    };
  } catch (error) {
    console.error('[IDENTITY] Error getting user by wallet legacy:', error);
    return null;
  }
}

/**
 * Get a user by username
 * @param username The username to look up
 * @returns The user identity information
 */
export async function getUserByUsername(username: string): Promise<UserIdentity | null> {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[IDENTITY] Supabase client not available');
      return null;
    }
    
    // Look up the user in the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (userError) {
      console.error('[IDENTITY] Error looking up user by username:', userError);
      return null;
    }
    
    if (!user) {
      return null;
    }
    
    // Check if the identity_registry table exists by trying to query it directly
    try {
      const { error: tableCheckError } = await supabase
        .from('identity_registry')
        .select('count(*)', { count: 'exact', head: true });
      
      // If the identity_registry table doesn't exist yet, return the user information
      if (tableCheckError) {
        console.log('[IDENTITY] Identity registry table does not exist yet, returning user info without identity registry data');
        return {
          id: user.id,
          walletAddress: user.wallet_address,
          normalizedWallet: user.wallet_address.toLowerCase(),
          username: user.username || `user_${user.wallet_address.substring(2, 8)}`,
          displayName: user.display_name || user.username || formatWalletAddress(user.wallet_address),
          profileImage: user.profile_image_url
        };
      }
    } catch (error) {
      console.error('[IDENTITY] Error checking if identity_registry table exists:', error);
      return {
        id: user.id,
        walletAddress: user.wallet_address,
        normalizedWallet: user.wallet_address.toLowerCase(),
        username: user.username || `user_${user.wallet_address.substring(2, 8)}`,
        displayName: user.display_name || user.username || formatWalletAddress(user.wallet_address),
        profileImage: user.profile_image_url
      };
    }
    
    // Look up the identity in the identity registry
    const { data: identity, error: identityError } = await supabase
      .from('identity_registry')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (identityError) {
      console.error('[IDENTITY] Error looking up identity by user ID:', identityError);
      // Return the user information without identity registry data
      return {
        id: user.id,
        walletAddress: user.wallet_address,
        normalizedWallet: user.wallet_address.toLowerCase(),
        username: user.username || `user_${user.wallet_address.substring(2, 8)}`,
        displayName: user.display_name || user.username || formatWalletAddress(user.wallet_address),
        profileImage: user.profile_image_url
      };
    }
    
    if (!identity) {
      // Return the user information without identity registry data
      return {
        id: user.id,
        walletAddress: user.wallet_address,
        normalizedWallet: user.wallet_address.toLowerCase(),
        username: user.username || `user_${user.wallet_address.substring(2, 8)}`,
        displayName: user.display_name || user.username || formatWalletAddress(user.wallet_address),
        profileImage: user.profile_image_url
      };
    }
    
    // Return the user identity information
    return {
      id: user.id,
      walletAddress: identity.wallet_address,
      normalizedWallet: identity.normalized_wallet,
      username: user.username || `user_${identity.normalized_wallet.substring(2, 8)}`,
      displayName: user.display_name || user.username || formatWalletAddress(identity.wallet_address),
      profileImage: user.profile_image_url,
      ensName: identity.ens_name,
      did: identity.did,
      lastLogin: identity.last_login
    };
  } catch (error) {
    console.error('[IDENTITY] Error getting user by username:', error);
    return null;
  }
}

/**
 * Get vehicles owned by a user
 * @param userIdentifier The user identifier (wallet address, username, or user ID)
 * @returns The vehicles owned by the user
 */
export async function getVehiclesByUser(userIdentifier: string) {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[IDENTITY] Supabase client not available');
      return [];
    }
    
    let normalizedWallet: string | null = null;
    
    // Check if the userIdentifier is a wallet address
    if (userIdentifier.startsWith('0x')) {
      normalizedWallet = userIdentifier.toLowerCase();
    } else {
      // Look up the user by username or ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('wallet_address')
        .or(`username.eq.${userIdentifier},id.eq.${userIdentifier}`)
        .maybeSingle();
      
      if (userError) {
        console.error('[IDENTITY] Error looking up user by identifier:', userError);
        return [];
      }
      
      if (!user) {
        return [];
      }
      
      normalizedWallet = user.wallet_address.toLowerCase();
    }
    
    // Query the vehicles table
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicle_profiles')
      .select(`
        *,
        vehicle_media(*),
        vehicle_specifications(*),
        vehicle_links(*),
        vehicle_videos(*)
      `)
      .eq('owner_wallet', normalizedWallet);
    
    if (vehiclesError) {
      console.error('[IDENTITY] Error looking up vehicles:', vehiclesError);
      return [];
    }
    
    return vehicles || [];
  } catch (error) {
    console.error('[IDENTITY] Error getting vehicles by user:', error);
    return [];
  }
}

/**
 * Check if a user owns a vehicle
 * @param userIdentifier The user identifier (wallet address, username, or user ID)
 * @param tokenId The token ID of the vehicle
 * @returns Whether the user owns the vehicle
 */
export async function isVehicleOwner(userIdentifier: string, tokenId: number | string) {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[IDENTITY] Supabase client not available');
      return false;
    }
    
    let normalizedWallet: string | null = null;
    
    // Check if the userIdentifier is a wallet address
    if (userIdentifier.startsWith('0x')) {
      normalizedWallet = userIdentifier.toLowerCase();
    } else {
      // Look up the user by username or ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('wallet_address')
        .or(`username.eq.${userIdentifier},id.eq.${userIdentifier}`)
        .maybeSingle();
      
      if (userError) {
        console.error('[IDENTITY] Error looking up user by identifier:', userError);
        return false;
      }
      
      if (!user) {
        return false;
      }
      
      normalizedWallet = user.wallet_address.toLowerCase();
    }
    
    // Query the vehicles table
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicle_profiles')
      .select('*')
      .eq('token_id', tokenId)
      .eq('owner_wallet', normalizedWallet)
      .maybeSingle();
    
    if (vehicleError) {
      console.error('[IDENTITY] Error checking vehicle ownership:', vehicleError);
      return false;
    }
    
    return !!vehicle;
  } catch (error) {
    console.error('[IDENTITY] Error checking vehicle ownership:', error);
    return false;
  }
}

/**
 * Format a wallet address for display
 * @param walletAddress The wallet address to format
 * @returns The formatted wallet address (e.g., 0x1234...5678)
 */
export function formatWalletAddress(walletAddress: string) {
  if (!walletAddress) return '';
  const address = walletAddress.toLowerCase();
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Get the display name for a user
 * @param userIdentity The user identity information
 * @returns The display name (username, ENS name, or formatted wallet address)
 */
export function getDisplayName(userIdentity: UserIdentity | null) {
  if (!userIdentity) return '';
  
  // Prioritize display name, then username, then ENS name, then formatted wallet address
  return userIdentity.displayName || 
         userIdentity.username || 
         userIdentity.ensName || 
         formatWalletAddress(userIdentity.walletAddress);
}

/**
 * Normalize a wallet address
 * @param walletAddress The wallet address to normalize
 * @returns The normalized wallet address
 */
export function normalizeWalletAddress(walletAddress: string) {
  return walletAddress.toLowerCase();
}

/**
 * Get the current authentication method
 * @returns Whether SIWE is being used
 */
export function isUsingSIWE() {
  return USE_SIWE;
}

/**
 * Register a wallet in the identity registry
 * This is used internally by the authentication system
 * @param walletAddress The wallet address to register
 * @param userId The user ID to associate with the wallet address
 * @returns The result of the operation
 */
export async function registerWalletInIdentityRegistry(walletAddress: string, userId?: string) {
  try {
    // Normalize the wallet address
    const normalizedWallet = walletAddress.toLowerCase();
    
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[IDENTITY] Supabase client not available');
      return { success: false, error: 'Supabase client not available' };
    }
    
    // Check if the identity_registry table exists by trying to query it directly
    try {
      const { error: tableCheckError } = await supabase
        .from('identity_registry')
        .select('count(*)', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.log('[IDENTITY] Identity registry table does not exist yet');
        return {
          success: false,
          error: 'Identity registry table does not exist. Please run the identity registry setup script.'
        };
      }
    } catch (error) {
      console.error('[IDENTITY] Error checking if identity_registry table exists:', error);
      return {
        success: false,
        error: 'Error checking if identity_registry table exists'
      };
    }
    
    // Check if the wallet is already registered
    const { data: existingIdentity, error: lookupError } = await supabase
      .from('identity_registry')
      .select('*')
      .eq('normalized_wallet', normalizedWallet)
      .maybeSingle();
    
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('[IDENTITY] Error looking up identity:', lookupError);
      return { success: false, error: lookupError };
    }
    
    if (existingIdentity) {
      // Update the existing identity
      const { error: updateError } = await supabase
        .from('identity_registry')
        .update({
          last_login: new Date().toISOString(),
          user_id: userId || existingIdentity.user_id,
        })
        .eq('id', existingIdentity.id);
      
      if (updateError) {
        console.error('[IDENTITY] Error updating identity:', updateError);
        return { success: false, error: updateError };
      }
      
      return { success: true, identity: { ...existingIdentity, last_login: new Date().toISOString() } };
    } else {
      // Create a new identity
      // Note: We're not using user_id anymore as it might not exist in the table
      const { data: newIdentity, error: insertError } = await supabase
        .from('identity_registry')
        .insert({
          wallet_address: walletAddress,
          normalized_wallet: normalizedWallet,
          username: generateUsernameFromWallet(walletAddress),
          display_name: formatWalletAddress(walletAddress),
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[IDENTITY] Error inserting identity:', insertError);
        return { success: false, error: insertError };
      }
      
      return { success: true, identity: newIdentity };
    }
  } catch (error) {
    console.error('[IDENTITY] Error registering wallet in identity registry:', error);
    return { success: false, error };
  }
}

/**
 * Generate a username for a wallet address
 * @param walletAddress The wallet address
 * @returns A username based on the wallet address
 */
export function generateUsernameFromWallet(walletAddress: string) {
  const normalizedWallet = walletAddress.toLowerCase();
  return `user_${normalizedWallet.substring(2, 8)}`;
}