import { useQuery } from '@tanstack/react-query';
import { vehicleQueries } from '../api/vehicleQueries';
import type { CompleteVehicleProfile } from '../api/vehicleQueries';

/**
 * Hook to fetch complete vehicle data including all relationships
 * @param tokenId The NFT token ID of the vehicle
 */
export function useVehicleData(tokenId: string | number) {
  return useQuery<CompleteVehicleProfile | null, Error>({
    queryKey: ['vehicle', tokenId],
    queryFn: async () => {
      // Convert tokenId to string if it's a number
      const tokenIdStr = tokenId.toString();
      return vehicleQueries.getCompleteProfile(tokenIdStr);
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

/**
 * Hook to fetch multiple vehicles with pagination
 */
export function useVehicles(params: {
  make?: string;
  model?: string;
  year?: number;
  username?: string;
  builder?: string;
  owner_id?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: async () => vehicleQueries.searchVehicles(params),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

/**
 * Hook to fetch vehicles by owner ID
 */
export function useVehiclesByOwner(ownerId: string) {
  return useQuery({
    queryKey: ['vehicles', 'owner', ownerId],
    queryFn: async () => vehicleQueries.searchVehicles({ owner_id: ownerId }),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    enabled: !!ownerId,
  });
}

/**
 * Hook to fetch vehicles with featured media
 */
export function useFeaturedVehicles(limit: number = 10) {
  return useQuery({
    queryKey: ['vehicles', 'featured', limit],
    queryFn: async () => vehicleQueries.searchVehicles({ limit }),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

/**
 * Hook to fetch vehicle parts
 */
export function useVehicleParts(tokenId: string | number) {
  const tokenIdStr = tokenId.toString();
  return useQuery({
    queryKey: ['vehicle', tokenIdStr, 'parts'],
    queryFn: async () => vehicleQueries.getVehicleParts(tokenIdStr),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

/**
 * Hook to fetch vehicle videos
 */
export function useVehicleVideos(tokenId: string | number) {
  const tokenIdStr = tokenId.toString();
  return useQuery({
    queryKey: ['vehicle', tokenIdStr, 'videos'],
    queryFn: async () => vehicleQueries.getVehicleVideos(tokenIdStr),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}