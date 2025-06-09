"use client";

import { useAccount, useSignMessage } from "wagmi";
import { useEffect, useState } from "react";
import { authenticateWithWallet, getAuthenticatedClient } from "../supabase";

/**
 * Sets the wallet address in the headers for all fetch requests
 * This allows the API routes to access the connected wallet address
 */
/**
 * Hook to authenticate with Supabase using the wallet address
 * and add the wallet address to headers for all fetch requests
 */
export function useWalletHeaders() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authenticate with Supabase using the wallet address
  useEffect(() => {
    const authenticateUser = async () => {
      if (!address) return;
      
      try {
        // Ensure wallet address is lowercase for consistent authentication
        const normalizedAddress = address.toLowerCase();
        console.log(`[DEBUG AUTH] Authenticating with normalized wallet address: ${normalizedAddress}`);
        
        // Authenticate with Supabase
        const client = await authenticateWithWallet(
          normalizedAddress, // Use normalized address
          async (message) => {
            try {
              console.log(`[DEBUG AUTH] Signing message: ${message}`);
              return await signMessageAsync({ message });
            } catch (error) {
              console.error('[DEBUG AUTH] Error signing message:', error);
              
              // If the error is related to getChainId, return a dummy signature
              // This will trigger the fallback mechanism in authenticateWithWallet
              if (String(error).includes('getChainId is not a function')) {
                console.log('[DEBUG AUTH] Detected getChainId error, returning dummy signature');
                return "0x0000000000000000000000000000000000000000000000000000000000000000";
              }
              
              throw error;
            }
          }
        );
        
        if (client) {
          console.log('Successfully authenticated with Supabase');
          setIsAuthenticated(true);
        } else {
          console.error('Failed to authenticate with Supabase');
        }
      } catch (error) {
        console.error('Error authenticating with Supabase:', error);
      }
    };
    
    authenticateUser();
  }, [address, signMessageAsync]);

  // Add wallet address to headers for all fetch requests
  useEffect(() => {
    if (!address) return;
    
    // Create a custom fetch function that adds the wallet address to headers
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      // Only modify requests to our own API
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      if (url.startsWith('/api/') && address) {
        const headers = new Headers(init?.headers || {});
        // Convert wallet address to lowercase for consistent authentication
        headers.set('x-wallet-address', address.toLowerCase());
        
        return originalFetch(input, {
          ...init,
          headers
        });
      }
      
      return originalFetch(input, init);
    };

    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, [address]);

  return { isAuthenticated };
}

/**
 * Hook to get an authenticated Supabase client
 */
export function useSupabaseClient() {
  const { address } = useAccount();
  
  return getAuthenticatedClient(address);
}