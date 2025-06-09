import { useEffect, useState } from 'react';
import { useContractRead } from 'wagmi';
import { useAuth } from '../auth/AuthContext';
import { useVehicleData } from './useVehicleData';

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
  
  // Get vehicle data from database
  const {
    data: vehicle,
    isLoading: isLoadingVehicle,
    error: vehicleError,
    refetch
  } = useVehicleData(tokenIdStr);
  
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
      vehicleOwnerId: vehicle?.owner_id,
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
    const vehicleOwnerId = vehicle.owner_id;
    const chainOwner = contractOwner ? contractOwner.toLowerCase() : '';
    
    // Get the owner from the identity_registry
    // Since we're transitioning from wallet-based to ID-based ownership,
    // we need to check if the user's ID matches the vehicle's owner_id
    const dbMatch = user.id === vehicleOwnerId;
    
    // Chain match - user wallet matches the owner on the blockchain
    const chainMatch = contractOwner ? userWallet === chainOwner : false;
    
    // Log ownership check details
    console.log('Ownership check details:', {
      userId: user.id,
      vehicleOwnerId,
      userWallet,
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
    vehicleProfile: vehicle, // For backward compatibility
    contractOwner,
    connectedAddress: user?.wallet_address,
    refetch
  };
}