/**
 * Authentication Helper Utilities
 * 
 * This file provides utilities for handling authentication-related functionality.
 * It integrates with the SIWE (Sign-In With Ethereum) authentication system.
 */

import { NextRequest } from 'next/server';
import { AuthenticationError } from '../../core/errors';
import { getSupabaseClient } from '../supabase';

/**
 * Get the wallet address from a request
 * 
 * @param request The request object
 * @returns The wallet address or null if not found
 */
export function getWalletAddressFromRequest(request: Request | NextRequest): string | null {
  // Try to get the wallet address from the x-wallet-address header
  const walletAddress = request.headers.get('x-wallet-address');
  
  if (walletAddress) {
    return normalizeWalletAddress(walletAddress);
  }
  
  // Try to get the wallet address from the authorization header
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extract the token from the Authorization header
    const token = authHeader.substring(7);
    
    try {
      // In a real implementation, you would verify the token
      // and extract the wallet address from it
      // For now, we'll just return the token as the wallet address
      return normalizeWalletAddress(token);
    } catch (error) {
      console.error('Error extracting wallet address from token:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Require authentication for a request
 * 
 * @param request The request object
 * @returns The wallet address
 * @throws AuthenticationError if no wallet address is found
 */
export function requireAuth(request: Request | NextRequest): string {
  const walletAddress = getWalletAddressFromRequest(request);
  
  if (!walletAddress) {
    throw new AuthenticationError('Authentication required');
  }
  
  return walletAddress;
}

/**
 * Check if a request is authenticated
 * 
 * @param request The request object
 * @returns Whether the request is authenticated
 */
export function isAuthenticated(request: Request | NextRequest): boolean {
  return getWalletAddressFromRequest(request) !== null;
}

/**
 * Normalize a wallet address
 * 
 * @param walletAddress The wallet address to normalize
 * @returns The normalized wallet address
 */
export function normalizeWalletAddress(walletAddress: string): string {
  return walletAddress.toLowerCase();
}

/**
 * Format a wallet address for display
 * 
 * @param walletAddress The wallet address to format
 * @returns The formatted wallet address (e.g., 0x1234...5678)
 */
export function formatWalletAddress(walletAddress: string): string {
  if (!walletAddress) return '';
  
  const address = walletAddress.toLowerCase();
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Generate a username from a wallet address
 * 
 * @param walletAddress The wallet address
 * @returns A username based on the wallet address
 */
export function generateUsernameFromWallet(walletAddress: string): string {
  const normalizedWallet = walletAddress.toLowerCase();
  return `user_${normalizedWallet.substring(2, 8)}`;
}

/**
 * Verify if a user is authorized to access a resource
 * 
 * @param walletAddress The wallet address of the user
 * @param resourceOwnerId The ID of the resource owner
 * @returns Whether the user is authorized
 */
export async function verifyAuthorization(walletAddress: string, resourceOwnerId: string): Promise<boolean> {
  try {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const normalizedOwnerId = normalizeWalletAddress(resourceOwnerId);
    
    // Simple case: the user is the owner
    if (normalizedWallet === normalizedOwnerId) {
      return true;
    }
    
    // Check if the user has admin privileges
    // This would typically involve checking a database
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Failed to get Supabase client');
      return false;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('user_type')
      .eq('wallet_address', normalizedWallet)
      .single();
    
    if (error) {
      console.error('Error checking user type:', error);
      return false;
    }
    
    // Check if the user is an admin
    return data?.user_type === 'admin';
  } catch (error) {
    console.error('Error verifying authorization:', error);
    return false;
  }
}