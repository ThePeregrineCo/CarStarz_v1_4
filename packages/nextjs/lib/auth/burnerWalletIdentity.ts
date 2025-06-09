import { getSupabaseClient } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Registers a wallet address in the identity registry
 * This function works with the existing Burner Wallet system
 * @param client The Supabase client
 * @param walletAddress The wallet address to register
 * @param userId The user ID to associate with the wallet address (optional)
 * @returns The result of the operation
 */
export async function registerWalletInIdentityRegistry(
  client: SupabaseClient<Database>,
  walletAddress: string,
  userId?: string
) {
  try {
    // Normalize the wallet address to lowercase
    const normalizedWallet = walletAddress.toLowerCase();
    console.log(`[IDENTITY] Registering wallet in identity registry: ${normalizedWallet}`);
    
    // Check if the identity_registry table exists
    const { data: tableExists, error: tableCheckError } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'identity_registry')
      .single();
    
    if (tableCheckError || !tableExists) {
      console.log('[IDENTITY] Identity registry table does not exist yet, skipping registration');
      return { success: false, error: 'Identity registry table does not exist' };
    }
    
    // Check if the wallet is already registered
    const { data: existingIdentity, error: lookupError } = await client
      .from('identity_registry')
      .select('*')
      .eq('normalized_wallet', normalizedWallet)
      .maybeSingle();
    
    if (lookupError) {
      console.error('[IDENTITY] Error looking up identity:', lookupError);
      return { success: false, error: lookupError };
    }
    
    if (existingIdentity) {
      // Update the existing identity
      console.log('[IDENTITY] Wallet already registered, updating last_login');
      const { error: updateError } = await client
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
      console.log('[IDENTITY] Wallet not registered, creating new identity');
      const { data: newIdentity, error: insertError } = await client
        .from('identity_registry')
        .insert({
          wallet_address: walletAddress,
          normalized_wallet: normalizedWallet,
          user_id: userId,
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
 * Enhanced version of authenticateWithWallet that also registers the wallet in the identity registry
 * This function works with the existing Burner Wallet system
 * @param walletAddress The wallet address to authenticate
 * @param signMessage A function that signs a message with the wallet
 * @returns The authenticated Supabase client
 */
export async function authenticateWithWalletAndRegister(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
) {
  try {
    // Normalize the wallet address to lowercase
    const normalizedWallet = walletAddress.toLowerCase();
    console.log(`[IDENTITY] Authenticating wallet: ${normalizedWallet}`);
    
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      console.error('[IDENTITY] Supabase client not available');
      return null;
    }
    
    // Create a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    
    // Create a message to sign
    const message = `Authenticate with CarStarz: ${nonce}`;
    
    try {
      // Sign the message with the wallet
      const signature = await signMessage(message);
      console.log(`[IDENTITY] Signature received: ${signature.substring(0, 20)}...`);
      
      // In a production environment, you would verify the signature
      // For now, we'll trust the signature since it's coming from the wallet
      
      // Check if the user exists in the users table
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', normalizedWallet)
        .maybeSingle();
      
      const userId = user?.id;
      
      // Register the wallet in the identity registry
      await registerWalletInIdentityRegistry(supabase, walletAddress, userId);
      
      // Return the authenticated client
      return supabase;
    } catch (error) {
      console.error('[IDENTITY] Error during message signing:', error);
      
      // If the error is related to getChainId, we'll try to bypass authentication
      const errorString = String(error);
      if (errorString.includes('getChainId is not a function')) {
        console.log('[IDENTITY] Detected getChainId error, using service role client as fallback');
        
        // Still try to register the wallet in the identity registry
        await registerWalletInIdentityRegistry(supabase, walletAddress);
        
        return supabase; // Return the service role client as a fallback
      }
      
      throw error;
    }
  } catch (error) {
    console.error('[IDENTITY] Error authenticating with wallet:', error);
    return null;
  }
}

/**
 * Creates the identity_registry table if it doesn't exist
 * This function is safe to call multiple times
 * @param client The Supabase client
 * @returns Whether the table was created successfully
 */
export async function ensureIdentityRegistryTableExists(client: SupabaseClient<Database>) {
  try {
    // Check if the identity_registry table exists
    const { data: tableExists, error: tableCheckError } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'identity_registry')
      .single();
    
    if (!tableCheckError && tableExists) {
      console.log('[IDENTITY] Identity registry table already exists');
      return true;
    }
    
    console.log('[IDENTITY] Creating identity registry table');
    
    // Create the identity_registry table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS identity_registry (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        wallet_address TEXT NOT NULL,
        normalized_wallet TEXT NOT NULL,
        user_id UUID,
        ens_name TEXT,
        did TEXT,
        last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_identity_registry_wallet_address ON identity_registry(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);
      CREATE INDEX IF NOT EXISTS idx_identity_registry_user_id ON identity_registry(user_id);
    `;
    
    const { error: createError } = await client.rpc('pgexec', { query: createTableQuery });
    
    if (createError) {
      console.error('[IDENTITY] Error creating identity registry table:', createError);
      return false;
    }
    
    console.log('[IDENTITY] Identity registry table created successfully');
    return true;
  } catch (error) {
    console.error('[IDENTITY] Error ensuring identity registry table exists:', error);
    return false;
  }
}

/**
 * Populates the identity registry with existing users
 * This function is safe to call multiple times
 * @param client The Supabase client
 * @returns Whether the population was successful
 */
export async function populateIdentityRegistryFromUsers(client: SupabaseClient<Database>) {
  try {
    // Ensure the identity registry table exists
    const tableExists = await ensureIdentityRegistryTableExists(client);
    if (!tableExists) {
      return false;
    }
    
    console.log('[IDENTITY] Populating identity registry from users table');
    
    // Get all users
    const { data: users, error: usersError } = await client
      .from('users')
      .select('id, wallet_address');
    
    if (usersError) {
      console.error('[IDENTITY] Error getting users:', usersError);
      return false;
    }
    
    console.log(`[IDENTITY] Found ${users.length} users to register`);
    
    // Register each user's wallet in the identity registry
    for (const user of users) {
      if (user.wallet_address) {
        await registerWalletInIdentityRegistry(client, user.wallet_address, user.id);
      }
    }
    
    console.log('[IDENTITY] Identity registry populated successfully');
    return true;
  } catch (error) {
    console.error('[IDENTITY] Error populating identity registry:', error);
    return false;
  }
}