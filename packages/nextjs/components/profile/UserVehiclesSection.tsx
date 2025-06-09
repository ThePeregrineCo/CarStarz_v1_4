"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabase';
import type { CompleteVehicleProfile } from '../../lib/api/vehicleQueriesV2';
import { VehicleCard } from '../VehicleCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';

interface UserVehiclesSectionProps {
  walletAddress: string;
}

export function UserVehiclesSection({ walletAddress }: UserVehiclesSectionProps) {
  // Fetch vehicles owned by this user
  const {
    data: vehicles,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userVehicles', walletAddress],
    queryFn: async () => {
      console.log(`[DEBUG] Fetching vehicles for wallet: ${walletAddress}`);
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Failed to get Supabase client');
      }
      
      // First, get the identity_id for this wallet address
      const { data: identityData, error: identityError } = await client
        .from('identity_registry')
        .select('id')
        .eq('normalized_wallet', walletAddress.toLowerCase())
        .maybeSingle();
        
      if (identityError) throw identityError;
      
      if (!identityData || !identityData.id) {
        console.log(`[DEBUG] No identity found for wallet ${walletAddress}`);
        return [];
      }
      
      const ownerId = identityData.id;
      console.log(`[DEBUG] Found identity ID ${ownerId} for wallet ${walletAddress}`);
      
      // Now get vehicles by owner_id
      const { data, error } = await client
        .from('vehicle_profiles')
        .select(`
          *,
          owner:identity_registry!owner_id(id, wallet_address, normalized_wallet, username, display_name, profile_image_url),
          vehicle_media(*),
          vehicle_videos(*),
          vehicle_specifications(*),
          vehicle_links(*)
        `)
        .eq('owner_id', ownerId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  if (isLoading) {
    return <LoadingSpinner size="medium" />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Vehicles"
        onRetry={() => refetch()}
      />
    );
  }
  
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg">
        <p className="text-gray-600">No vehicles found for this user.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Vehicles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.token_id}
            id={parseInt(vehicle.token_id)}
            vehicle={{
              vin: vehicle.vin || '',
              name: vehicle.name || 'Unnamed Vehicle',
              metadataURI: '',
            }}
            owner={vehicle.owner_wallet}
            image={vehicle.primary_image_url || '/images/vehicle-placeholder.jpg'}
            year={vehicle.year || 'N/A'}
            make={vehicle.make || 'Unknown'}
            model={vehicle.model || 'Unknown'}
            description={vehicle.description || 'No description available'}
            media={vehicle.vehicle_media || []}
            specifications={vehicle.vehicle_specifications || []}
            links={vehicle.vehicle_links || []}
            videos={vehicle.vehicle_videos || []}
            parts={vehicle.parts || []}
          />
        ))}
      </div>
    </div>
  );
}