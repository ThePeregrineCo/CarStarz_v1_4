"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { getSupabaseClient } from '../supabase';

interface User {
  id: string;
  wallet_address: string;
  username: string | null;
  email: string | null;
  profile_image_url: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch or create user when wallet connects
  useEffect(() => {
    async function fetchOrCreateUser() {
      if (!address || !isConnected) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const client = getSupabaseClient(true);
        if (!client) {
          throw new Error('Failed to get Supabase client');
        }
        
        // Check if user exists
        const { data: existingUser, error: fetchError } = await client
          .from('identity_registry')
          .select('*')
          .eq('normalized_wallet', address.toLowerCase())
          .maybeSingle();
          
        if (fetchError) throw fetchError;
        
        if (existingUser) {
          // User exists, return it
          setUser(existingUser as User);
        } else {
          // User doesn't exist, create a new one
          const { data: newUser, error: createError } = await client
            .from('identity_registry')
            .insert([
              {
                wallet_address: address.toLowerCase(),
                normalized_wallet: address.toLowerCase(),
                username: `user_${address.toLowerCase().substring(2, 8)}`,
                display_name: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
                is_profile_complete: false
              }
            ])
            .select()
            .single();
            
          if (createError) throw createError;
          setUser(newUser as User);
        }
      } catch (err) {
        console.error('Error fetching or creating user:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrCreateUser();
  }, [address, isConnected]);

  // Update user profile
  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const client = getSupabaseClient(true);
      if (!client) {
        throw new Error('Failed to get Supabase client');
      }
      
      const { data: updatedUser, error } = await client
        .from('identity_registry')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      setUser(updatedUser as User);
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}