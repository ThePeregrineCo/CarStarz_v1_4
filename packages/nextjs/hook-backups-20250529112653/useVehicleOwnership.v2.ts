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
 * Enhanced hook to check vehicle ownership using both blockchain and database
 * Integrates with the new AuthContext for consistent authentication
 * 
 * @param tokenId The NFT token ID of the vehicle
 * @returns Object containing ownership status and related data
 */
export function useVehicleOwnershipV2(tokenId: string | number) {
  const { user, isAuthenticated } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  
  // Convert tokenId to appropriate formats
  const tokenIdStr = tokenId.toString();
  const tokenIdBigInt = BigInt(tokenIdStr);
  
  // Get vehicle data from database
  const { 
    data: vehicle, 
    isLoading: isLoadingVehicle,
    error: vehicleError
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
    if (!isAuthenticated || !user || !vehicle || !contractOwner) {
      setIsOwner(false);
      return;
    }
    
    const userWallet = user.wallet_address.toLowerCase();
    const dbOwner = vehicle.owner_wallet.toLowerCase();
    const chainOwner = contractOwner.toLowerCase();
    
    // Always require database ownership match to ensure only the owner can edit
    // This is critical for proper access control
    console.log('Checking ownership:', {
      userWallet,
      dbOwner,
      chainOwner,
      dbMatch: userWallet === dbOwner,
      chainMatch: userWallet === chainOwner
    });
    
    // Primary ownership check is based on database record
    // This ensures consistency with the database state
    setIsOwner(userWallet === dbOwner);
  }, [isAuthenticated, user, vehicle, contractOwner]);
  
  return {
    isOwner,
    isLoading: isLoadingVehicle || isLoadingOwner,
    error: vehicleError || contractError,
    vehicle,
    contractOwner,
    user,
  };
}