import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfiles, businessProfiles, clubProfiles } from '../api/profileQueries';
import type {
  UserProfile,
  BusinessProfile,
  ClubProfile
} from '../types/profiles';

/**
 * User Profile Hooks
 */

// Hook to fetch a user profile by wallet address
export function useUserProfile(walletAddress?: string) {
  return useQuery({
    queryKey: ['userProfile', walletAddress?.toLowerCase()],
    queryFn: () => walletAddress ? userProfiles.getByWalletAddress(walletAddress) : null,
    enabled: !!walletAddress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to fetch a user profile by username
export function useUserProfileByUsername(username?: string) {
  return useQuery({
    queryKey: ['userProfile', 'username', username],
    queryFn: () => username ? userProfiles.getByUsername(username) : null,
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to update a user profile
export function useUpdateUserProfile(walletAddress?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => {
      if (!walletAddress) throw new Error('Wallet address is required');
      return userProfiles.update(walletAddress, data);
    },
    onSuccess: () => {
      if (walletAddress) {
        queryClient.invalidateQueries({ queryKey: ['userProfile', walletAddress.toLowerCase()] });
      }
    },
  });
}

// Hook to fetch user profile stats
export function useUserProfileStats(userId?: string) {
  return useQuery({
    queryKey: ['userProfileStats', userId],
    queryFn: () => userId ? userProfiles.getStats(userId) : null,
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to check if a username is available
export function useUsernameAvailability(username: string) {
  return useQuery({
    queryKey: ['usernameAvailability', username],
    queryFn: () => userProfiles.isUsernameAvailable(username),
    enabled: !!username && username.length >= 3,
    staleTime: 0, // Always check availability fresh
  });
}

/**
 * Business Profile Hooks
 */

// Hook to fetch a business profile by ID
export function useBusinessProfile(businessId?: string) {
  return useQuery({
    queryKey: ['businessProfile', businessId],
    queryFn: () => businessId ? businessProfiles.getById(businessId) : null,
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to fetch business profiles by user ID
export function useBusinessProfilesByUser(userId?: string) {
  return useQuery({
    queryKey: ['businessProfiles', 'user', userId],
    queryFn: () => userId ? businessProfiles.getByUserId(userId) : [],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to create a business profile
export function useCreateBusinessProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>) => 
      businessProfiles.create(data),
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['businessProfile', data.id] });
        queryClient.invalidateQueries({ queryKey: ['businessProfiles', 'user', variables.user_id] });
      }
    },
  });
}

// Hook to update a business profile
export function useUpdateBusinessProfile(businessId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<BusinessProfile>) => {
      if (!businessId) throw new Error('Business ID is required');
      return businessProfiles.update(businessId, data);
    },
    onSuccess: (_, variables) => {
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['businessProfile', businessId] });
        if (variables.user_id) {
          queryClient.invalidateQueries({ queryKey: ['businessProfiles', 'user', variables.user_id] });
        }
      }
    },
  });
}

// Hook to fetch business profile stats
export function useBusinessProfileStats(businessId?: string) {
  return useQuery({
    queryKey: ['businessProfileStats', businessId],
    queryFn: () => businessId ? businessProfiles.getStats(businessId) : null,
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Club Profile Hooks
 */

// Hook to fetch a club profile by ID
export function useClubProfile(clubId?: string) {
  return useQuery({
    queryKey: ['clubProfile', clubId],
    queryFn: () => clubId ? clubProfiles.getById(clubId) : null,
    enabled: !!clubId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to fetch club profiles by creator ID
export function useClubProfilesByCreator(creatorId?: string) {
  return useQuery({
    queryKey: ['clubProfiles', 'creator', creatorId],
    queryFn: () => creatorId ? clubProfiles.getByCreatorId(creatorId) : [],
    enabled: !!creatorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to create a club profile
export function useCreateClubProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<ClubProfile, 'id' | 'created_at' | 'updated_at' | 'member_count'>) => 
      clubProfiles.create(data),
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['clubProfile', data.id] });
        queryClient.invalidateQueries({ queryKey: ['clubProfiles', 'creator', variables.creator_id] });
      }
    },
  });
}

// Hook to update a club profile
export function useUpdateClubProfile(clubId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<ClubProfile>) => {
      if (!clubId) throw new Error('Club ID is required');
      return clubProfiles.update(clubId, data);
    },
    onSuccess: (_, variables) => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: ['clubProfile', clubId] });
        if (variables.creator_id) {
          queryClient.invalidateQueries({ queryKey: ['clubProfiles', 'creator', variables.creator_id] });
        }
      }
    },
  });
}

// Hook to fetch club profile stats
export function useClubProfileStats(clubId?: string) {
  return useQuery({
    queryKey: ['clubProfileStats', clubId],
    queryFn: () => clubId ? clubProfiles.getStats(clubId) : null,
    enabled: !!clubId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}