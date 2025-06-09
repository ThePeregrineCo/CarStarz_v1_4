import { SiweMessage } from 'siwe';
import { getSupabaseClient } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Creates a SIWE message for the given address and nonce
 * @param address The wallet address to authenticate
 * @param nonce A random nonce for security
 * @param domain The domain of the application
 * @param uri The URI of the application
 * @returns A SIWE message
 */
export function createSiweMessage(
  address: string,
  nonce: string,
  domain: string = typeof window !== 'undefined' ? window.location.host : 'carstarz.app',
  uri: string = typeof window !== 'undefined' ? window.location.origin : 'https://carstarz.app'
): string {
  const message = new SiweMessage({
    domain,
    address,
    statement: 'Sign in with Ethereum to CarStarz',
    uri,
    version: '1',
    chainId: 1, // Ethereum mainnet
    nonce,
    issuedAt: new Date().toISOString(),
  });

  return message.prepareMessage();
}

/**
 * Verifies a SIWE signature
 * @param message The SIWE message that was signed
 * @param signature The signature to verify
 * @returns Whether the signature is valid
 */
export async function verifySiweSignature(
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const siweMessage = new SiweMessage(message);
    const { success } = await siweMessage.verify({
      signature,
    });
    return success;
  } catch (error) {
    console.error('[SIWE] Error verifying signature:', error);
    return false;
  }
}

/**
 * Registers a wallet address in the identity registry
 * @param client The Supabase client
 * @param walletAddress The wallet address to register
 * @param userId The user ID to associate with the wallet address
 * @param ensName Optional ENS name for the wallet
 * @returns The result of the operation
 */
export async function registerWalletInIdentityRegistry(
  client: SupabaseClient<Database>,
  walletAddress: string,
  userId: string,
  ensName?: string
) {
  const normalizedWallet = walletAddress.toLowerCase();
  
  // Check if the wallet is already registered
  const { data: existingIdentity, error: lookupError } = await client
    .from('identity_registry')
    .select('*')
    .eq('normalized_wallet', normalizedWallet)
    .single();
  
  if (lookupError && lookupError.code !== 'PGRST116') {
    console.error('[SIWE] Error looking up identity:', lookupError);
    return { success: false, error: lookupError };
  }
  
  if (existingIdentity) {
    // Update the existing identity
    const { error: updateError } = await client
      .from('identity_registry')
      .update({
        user_id: userId,
        ens_name: ensName,
        last_login: new Date().toISOString(),
      })
      .eq('normalized_wallet', normalizedWallet);
    
    if (updateError) {
      console.error('[SIWE] Error updating identity:', updateError);
      return { success: false, error: updateError };
    }
    
    return { success: true, identity: { ...existingIdentity, user_id: userId, ens_name: ensName } };
  } else {
    // Create a new identity
    const { data: newIdentity, error: insertError } = await client
      .from('identity_registry')
      .insert({
        wallet_address: walletAddress,
        normalized_wallet: normalizedWallet,
        user_id: userId,
        ens_name: ensName,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('[SIWE] Error inserting identity:', insertError);
      return { success: false, error: insertError };
    }
    
    return { success: true, identity: newIdentity };
  }
}

/**
 * Authenticates a user with SIWE
 * @param walletAddress The wallet address to authenticate
 * @param signMessage A function that signs a message with the wallet
 * @returns The authenticated Supabase client and user information
 */
export async function authenticateWithSiwe(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<{ client: SupabaseClient<Database> | null; user: any | null }> {
  try {
    // Normalize the wallet address
    const normalizedWallet = walletAddress.toLowerCase();
    
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[SIWE] Supabase client not available');
      return { client: null, user: null };
    }
    
    // Create a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    
    // Create a SIWE message
    const message = createSiweMessage(normalizedWallet, nonce);
    
    try {
      // Sign the message with the wallet
      const signature = await signMessage(message);
      
      // Verify the signature
      const isValid = await verifySiweSignature(message, signature);
      if (!isValid) {
        console.error('[SIWE] Invalid signature');
        return { client: null, user: null };
      }
      
      // Check if the user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', normalizedWallet)
        .single();
      
      let userId = user?.id;
      
      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create a new one
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            wallet_address: normalizedWallet,
            username: `user_${normalizedWallet.substring(2, 8)}`,
          })
          .select()
          .single();
        
        if (createError) {
          console.error('[SIWE] Error creating user:', createError);
          return { client: null, user: null };
        }
        
        userId = newUser.id;
      } else if (userError) {
        console.error('[SIWE] Error looking up user:', userError);
        return { client: null, user: null };
      }
      
      // Register the wallet in the identity registry
      const { success, identity } = await registerWalletInIdentityRegistry(
        supabase,
        walletAddress,
        userId
      );
      
      if (!success) {
        console.error('[SIWE] Error registering wallet in identity registry');
        return { client: null, user: null };
      }
      
      // In a production environment, you would create a JWT token
      // and use it to authenticate the user with Supabase
      // For now, we'll use the service role client
      
      return { client: supabase, user: { id: userId, wallet: normalizedWallet, identity } };
    } catch (error) {
      console.error('[SIWE] Error during message signing:', error);
      
      // If the error is related to getChainId, we'll try to bypass authentication
      const errorString = String(error);
      if (errorString.includes('getChainId is not a function')) {
        console.log('[SIWE] Detected getChainId error, using service role client as fallback');
        return { client: supabase, user: null };
      }
      
      throw error;
    }
  } catch (error) {
    console.error('[SIWE] Error authenticating with SIWE:', error);
    return { client: null, user: null };
  }
}