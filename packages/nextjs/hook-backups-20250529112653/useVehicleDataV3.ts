import { useQuery } from '@tanstack/react-query';
import { vehicleQueries } from '../api/vehicleQueries.unified';
import type { CompleteVehicleProfile } from '../api/vehicleQueries.unified';

/**
 * Hook to fetch complete vehicle data including all relationships
 * @param tokenId The NFT token ID of the vehicle
 */
export function useVehicleDataV3(tokenId: string | number) {
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
export function useVehiclesV3(params: {
  make?: string;
  model?: string;
  year?: number;
  username?: string;
  builder?: string;
  owner_wallet?: string;
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
 * Hook to fetch vehicles by owner wallet address
 */
export function useVehiclesByOwnerV3(ownerWallet: string) {
  return useQuery({
    queryKey: ['vehicles', 'owner', ownerWallet],
    queryFn: async () => vehicleQueries.searchVehicles({ owner_wallet: ownerWallet }),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    enabled: !!ownerWallet,
  });
}

/**
 * Hook to fetch vehicles with featured media
 */
export function useFeaturedVehiclesV3(limit: number = 10) {
  return useQuery({
    queryKey: ['vehicles', 'featured', limit],
    queryFn: async () => vehicleQueries.searchVehicles({ limit }),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}