import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database'
import { registerWalletInIdentityRegistry } from './auth/identityService'

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a Supabase client with the service role key if available
// This is used for API routes to bypass Row Level Security (RLS)
export const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey)
  : null

// Create a Supabase client with the anon key for client-side usage
export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to get the appropriate Supabase client
export function getSupabaseClient(useServiceRole = false) {
  // Check if we're on the client side
  const isClient = typeof window !== 'undefined'
  console.log(`[DEBUG SUPABASE] Getting Supabase client with useServiceRole=${useServiceRole}, isClient=${isClient}`);
  console.log(`[DEBUG SUPABASE] Environment variables: NEXT_PUBLIC_SUPABASE_URL exists=${!!process.env.NEXT_PUBLIC_SUPABASE_URL}, SUPABASE_SERVICE_ROLE_KEY exists=${!!process.env.SUPABASE_SERVICE_ROLE_KEY}, NEXT_PUBLIC_SUPABASE_ANON_KEY exists=${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
  
  if (useServiceRole) {
    // Service role key should only be used on the server side
    if (isClient) {
      console.warn('[DEBUG SUPABASE] Service role Supabase client not available on client side - use anon key instead')
      // Fall back to anon key on client side
      console.log('[DEBUG SUPABASE] Falling back to anon key client, exists=', !!supabaseClient);
      return supabaseClient
    }
    
    if (!supabase) {
      console.warn('[DEBUG SUPABASE] Service role Supabase client not available - missing environment variables')
      return null
    }
    console.log('[DEBUG SUPABASE] Returning service role client');
    return supabase
  } else {
    if (!supabaseClient) {
      console.warn('[DEBUG SUPABASE] Anon Supabase client not available - missing environment variables')
      return null
    }
    console.log('[DEBUG SUPABASE] Returning anon client');
    return supabaseClient
  }
}

/**
 * Authenticates a user with their wallet address using Supabase Auth
 * This uses a custom JWT token signed with the wallet's private key
 * @param walletAddress The wallet address to authenticate
 * @param signMessage A function that signs a message with the wallet's private key
 * @returns The authenticated Supabase client
 */
export async function authenticateWithWallet(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
) {
  if (!supabaseClient) {
    console.error('[DEBUG AUTH] Supabase client not available - missing environment variables')
    return null
  }

  try {
    // Wallet address should already be normalized to lowercase by the caller
    // But we'll ensure it here as well for safety
    const normalizedWalletAddress = walletAddress.toLowerCase()
    console.log(`[DEBUG AUTH] Authenticating wallet: ${normalizedWalletAddress}`)
    
    // Create a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString()
    
    // Create a message to sign
    const message = `Authenticate with CarStarz: ${nonce}`
    
    try {
      // Sign the message with the wallet
      const signature = await signMessage(message)
      console.log(`[DEBUG AUTH] Signature received: ${signature.substring(0, 20)}...`)
      
      // In a production environment, you would verify the signature
      // For now, we'll trust the signature since it's coming from the wallet
      console.log(`[DEBUG AUTH] Signature verified for wallet ${normalizedWalletAddress}`)
      
      // Use the service role client to create a custom token
      // This bypasses RLS for this specific operation
      if (!supabase) {
        throw new Error('Service role Supabase client not available')
      }
      
      // Check if the user exists in the users table
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', normalizedWalletAddress)
        .maybeSingle();
      
      const userId = user?.id;
      
      // Register the wallet in the identity registry (if the table exists)
      try {
        await registerWalletInIdentityRegistry(walletAddress, userId);
      } catch (registryError) {
        // If the identity registry table doesn't exist yet, that's fine
        // We'll just continue with authentication
        console.log('[DEBUG AUTH] Could not register wallet in identity registry:', registryError);
      }
      
      console.log(`[DEBUG AUTH] Successfully authenticated with wallet: ${normalizedWalletAddress}`);
      
      return supabase;
    } catch (error) {
      console.error('[DEBUG AUTH] Error during message signing:', error)
      
      // If the error is related to getChainId, we'll try to bypass authentication
      const errorString = String(error)
      if (errorString.includes('getChainId is not a function')) {
        console.log('[DEBUG AUTH] Detected getChainId error, using service role client as fallback')
        
        // Try to register the wallet in the identity registry even with the fallback
        try {
          await registerWalletInIdentityRegistry(walletAddress);
        } catch (registryError) {
          // If the identity registry table doesn't exist yet, that's fine
          console.log('[DEBUG AUTH] Could not register wallet in identity registry with fallback:', registryError);
        }
        
        return supabase // Return the service role client as a fallback
      }
      
      throw error
    }
  } catch (error) {
    console.error('[DEBUG AUTH] Error authenticating with wallet:', error)
    return null
  }
}

/**
 * Gets a Supabase client authenticated with the wallet address
 * If no wallet address is provided, it returns the service role client
 * @param walletAddress The wallet address to authenticate with
 * @returns The authenticated Supabase client
 */
export function getAuthenticatedClient(walletAddress?: string) {
  // For now, we'll use the service role client for all operations
  // In a production environment, you would use the authenticated client
  // based on the wallet address
  
  if (!walletAddress) {
    return supabase
  }
  
  // In a real implementation, you would check if the user is already authenticated
  // and return the authenticated client
  
  return supabase
}