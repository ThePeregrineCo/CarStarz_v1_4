"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleQueries } from '../api/vehicleQueries';
import { useVehicleOwnership } from '../hooks/useVehicleOwnership';
import type { VehicleProfile, CompleteVehicleProfile } from '../api/vehicleQueries';

interface VehicleContextType {
  vehicle: VehicleProfile | CompleteVehicleProfile | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isOwner: boolean;
  contractOwner: string | undefined;
  refetch: () => Promise<any>;
  updateVehicle: (data: Partial<VehicleProfile | CompleteVehicleProfile>) => Promise<any>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({
  children,
  tokenId
}: {
  children: ReactNode;
  tokenId: string | number;
}) {
  const queryClient = useQueryClient();
  
  // Use our unified hook for vehicle data and ownership
  const {
    vehicle: vehicleProfile,
    isLoading,
    error,
    isOwner,
    contractOwner,
    refetch
  } = useVehicleOwnership(tokenId);
  
  // Update vehicle mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<VehicleProfile | CompleteVehicleProfile>) => {
      try {
        console.log(`Updating vehicle profile for token ID ${tokenId}...`);
        // Use type assertion to handle type incompatibility between different versions
        const success = await vehicleQueries.updateVehicleProfile(
          tokenId.toString(),
          data as any
        );
        console.log(`Updated vehicle profile successfully`);
        return success;
      } catch (error) {
        console.error(`Error updating vehicle profile for token ID ${tokenId}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenId.toString()] });
      refetch();
    },
  });

  const value = {
    vehicle: vehicleProfile || null,
    isLoading,
    isError: !!error,
    error: error as Error | null,
    isOwner,
    contractOwner,
    refetch,
    updateVehicle: updateMutation.mutateAsync,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
}