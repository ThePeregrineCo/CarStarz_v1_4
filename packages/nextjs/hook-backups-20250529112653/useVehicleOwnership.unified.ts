import { useEffect, useState } from 'react';
import { useContractRead } from 'wagmi';
import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { vehicleQueriesV3Fixed } from '../api/vehicleQueriesV3Fixed';
// No need to import the type since we're using the return type from the API directly

// Vehicle NFT ABI for the ownerOf function
const VEHICLE_NFT_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Unified hook to check vehicle ownership using both blockchain and database
 * Combines the best features from all previous versions
 * 
 * @param tokenId The NFT token ID of the vehicle
 * @returns Object containing ownership status and related data
 */
export function useVehicleOwnership(tokenId: string | number) {
  // Get authentication data from AuthContext
  const { user, isAuthenticated } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  
  // Convert tokenId to appropriate formats
  const tokenIdStr = tokenId.toString();
  const tokenIdBigInt = BigInt(tokenIdStr);
  
  // Get vehicle data from database using the latest query version
  const { 
    data: vehicle, 
    isLoading: isLoadingVehicle,
    error: vehicleError,
    refetch
  } = useQuery({
    queryKey: ['vehicle', tokenIdStr],
    queryFn: async () => {
      try {
        console.log(`Fetching vehicle profile for token ID ${tokenIdStr}`);
        const profile = await vehicleQueriesV3Fixed.getCompleteProfile(tokenIdStr);
        return profile;
      } catch (error) {
        console.error(`Error fetching vehicle profile for token ID ${tokenIdStr}:`, error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Get owner from blockchain
  const { 
    data: contractOwner,
    isLoading: isLoadingOwner,
    error: contractError
  } = useContractRead({
    address: process.env.NEXT_PUBLIC_VEHICLE_NFT_ADDRESS as `0x${string}`,
    abi: VEHICLE_NFT_ABI,
    functionName: 'ownerOf',
    args: tokenId ? [tokenIdBigInt] : undefined,
  });
  
  // Determine ownership status whenever relevant data changes
  useEffect(() => {
    // Debug authentication state
    console.log('Ownership verification:', {
      isAuthenticated,
      hasUser: !!user,
      hasVehicle: !!vehicle,
      hasContractOwner: !!contractOwner,
      userWallet: user?.wallet_address,
      vehicleOwner: vehicle?.owner_wallet,
      contractOwnerAddress: contractOwner
    });
    
    // If missing authentication, user, or vehicle data, set isOwner to false
    if (!isAuthenticated || !user || !vehicle) {
      console.log('Setting isOwner to false due to missing auth, user, or vehicle data');
      setIsOwner(false);
      return;
    }
    
    // Perform ownership verification
    const userWallet = user.wallet_address.toLowerCase();
    const dbOwner = vehicle.owner_wallet.toLowerCase();
    const chainOwner = contractOwner ? contractOwner.toLowerCase() : '';
    
    // Database match - user wallet matches the owner in the database
    const dbMatch = userWallet === dbOwner;
    
    // Chain match - user wallet matches the owner on the blockchain
    const chainMatch = contractOwner ? userWallet === chainOwner : false;
    
    // Log ownership check details
    console.log('Ownership check details:', {
      userWallet,
      dbOwner,
      chainOwner,
      dbMatch,
      chainMatch
    });
    
    // Primary ownership check is based on database record
    // This ensures consistency with the database state
    setIsOwner(dbMatch);
  }, [isAuthenticated, user, vehicle, contractOwner]);
  
  return {
    isOwner,
    isLoading: isLoadingVehicle || isLoadingOwner,
    error: vehicleError || contractError,
    vehicle,
    contractOwner,
    user,
    refetch
  };
}