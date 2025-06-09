"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useUserProfile, useUserProfileStats } from '../../lib/hooks/useProfiles';
import { useAuth } from '../../lib/auth/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { UserProfileEditForm } from './UserProfileEditForm';
import { SocialLinks } from './SocialLinks';
import { VehicleCard } from '../VehicleCard';
import { useQuery } from '@tanstack/react-query';

// Import the necessary hooks and APIs
import { userProfiles } from '../../lib/api/profileQueries';

// Create the missing hook
function useUserProfileByUsername(username?: string) {
  return useQuery({
    queryKey: ['userProfile', 'username', username],
    queryFn: () => username ? userProfiles.getByUsername(username) : null,
    enabled: !!username,
  });
}

interface UserProfileV2Props {
  walletAddress?: string;
  username?: string;
}

/**
 * Enhanced user profile component that displays user information
 * and provides editing capabilities for the profile owner
 */
export function UserProfileV2({ walletAddress, username }: UserProfileV2Props) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch user profile data - avoid conditional hook calls
  const {
    data: profileByWallet,
    isLoading: isLoadingByWallet,
    error: errorByWallet,
    refetch: refetchByWallet
  } = useUserProfile(walletAddress);
  
  const {
    data: profileByUsername,
    isLoading: isLoadingByUsername,
    error: errorByUsername,
    refetch: refetchByUsername
  } = useUserProfileByUsername(username);
  
  // Combine the results
  const profile = walletAddress ? profileByWallet : profileByUsername;
  const isLoading = walletAddress ? isLoadingByWallet : isLoadingByUsername;
  const error = walletAddress ? errorByWallet : errorByUsername;
  const refetch = walletAddress ? refetchByWallet : refetchByUsername;
  
  // Fetch user stats
  const {
    data: stats
  } = useUserProfileStats(profile?.id);
  
  // Check if the current user is the profile owner
  const isOwner = user?.wallet_address?.toLowerCase() === profile?.wallet_address?.toLowerCase();
  
  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Profile"
        onRetry={() => refetch()}
      />
    );
  }
  
  if (!profile) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
        <p className="mt-2 text-gray-600">
          The user profile you&apos;re looking for could not be found.
        </p>
      </div>
    );
  }
  
  // Display mode
  if (!isEditing) {
    return (
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Banner Image */}
        <div className="relative h-48 w-full bg-gradient-to-r from-blue-400 to-purple-500">
          {profile.banner_image_url && (
            <Image
              src={profile.banner_image_url}
              alt="Profile banner"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          )}
        </div>
        
        {/* Profile Header */}
        <div className="relative px-6 pb-6">
          {/* Profile Image */}
          <div className="absolute -top-16 left-6">
            <div className="relative h-32 w-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
              {profile.profile_image_url ? (
                <Image
                  src={profile.profile_image_url}
                  alt={profile.username || profile.wallet_address}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-blue-100 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Edit Button (only shown to owner) */}
          {isOwner && (
            <div className="absolute top-4 right-6">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
          
          {/* Profile Info */}
          <div className="mt-20">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.display_name || profile.username || `User ${profile.wallet_address.substring(0, 6)}...`}
            </h1>
            
            {profile.username && (
              <p className="text-gray-500">@{profile.username}</p>
            )}
            
            {profile.bio && (
              <div className="mt-4 text-gray-700 whitespace-pre-line">
                {profile.bio}
              </div>
            )}
            
            {/* User Stats */}
            <div className="mt-6 flex space-x-6">
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{stats?.vehicle_count || 0}</span>
                <span className="text-sm text-gray-500">Vehicles</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{stats?.follower_count || 0}</span>
                <span className="text-sm text-gray-500">Followers</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{stats?.following_count || 0}</span>
                <span className="text-sm text-gray-500">Following</span>
              </div>
            </div>
            
            {/* Subscription Badge */}
            {profile.subscription_tier !== 'free' && (
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.subscription_tier === 'standard' ? 'bg-blue-100 text-blue-800' :
                  profile.subscription_tier === 'collector' ? 'bg-purple-100 text-purple-800' :
                  'bg-gold-100 text-gold-800'
                }`}>
                  {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)} Member
                </span>
              </div>
            )}
            
            {/* Social Links */}
            {profile.social_links && profile.social_links.length > 0 && (
              <div className="mt-6">
                <SocialLinks links={profile.social_links} />
              </div>
            )}
            
            {/* User's Vehicles Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Vehicles</h2>
              <UserVehiclesSection walletAddress={profile.wallet_address} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Component to display user's vehicles
  function UserVehiclesSection({ walletAddress }: { walletAddress: string }) {
    // Fetch vehicles owned by this user
    const {
      data: vehicles,
      isLoading,
      error
    } = useQuery({
      queryKey: ['userVehicles', walletAddress],
      queryFn: async () => {
        // Ensure wallet address is lowercase for consistent querying
        const normalizedWalletAddress = walletAddress.toLowerCase();
        console.log(`[DEBUG] Fetching vehicles for normalized wallet: ${normalizedWalletAddress}`);
        
        // First, get the identity_id for this wallet address
        const identityResponse = await fetch(`/api/identity?normalized_wallet=${normalizedWalletAddress}`);
        if (!identityResponse.ok) {
          throw new Error(`Failed to fetch identity: ${identityResponse.status}`);
        }
        const identityData = await identityResponse.json();
        const ownerId = identityData?.id;
        
        if (!ownerId) {
          console.log(`[DEBUG] No identity found for wallet ${normalizedWalletAddress}`);
          return [];
        }
        
        // Add cache-busting parameter
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/api/vehicles?owner_id=${ownerId}&_=${cacheBuster}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch vehicles: ${response.status}`);
        }
        const data = await response.json();
        console.log(`[DEBUG] Found ${data.length} vehicles for owner ID ${ownerId}`);
        console.log('[DEBUG] Raw vehicle data:', JSON.stringify(data, null, 2));
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
    
    if (isLoading) {
      return <div className="text-center py-4"><LoadingSpinner size="small" /></div>;
    }
    
    if (error) {
      return <div className="text-red-500 text-center py-4">Error loading vehicles</div>;
    }
    
    if (!vehicles || vehicles.length === 0) {
      return <div className="text-gray-500 text-center py-4">No vehicles found</div>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle: any) => (
          <VehicleCard
            key={vehicle.tokenId}
            id={parseInt(vehicle.tokenId)}
            vehicle={{
              vin: vehicle.vin || '',
              name: vehicle.name || 'Unnamed Vehicle',
              metadataURI: '',
            }}
            owner={vehicle.owner}
            image={vehicle.image || '/images/vehicle-placeholder.jpg'}
            year={vehicle.year || 'N/A'}
            make={vehicle.make || 'Unknown'}
            model={vehicle.model || 'Unknown'}
            description={vehicle.description || 'No description available'}
            media={vehicle.vehicle_media || []}
            specifications={vehicle.vehicle_specifications || []}
            links={vehicle.vehicle_links || []}
            modifications={[]}
          />
        ))}
      </div>
    );
  }
  
  // Edit mode
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
        <UserProfileEditForm 
          profile={profile} 
          onCancel={() => setIsEditing(false)} 
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    </div>
  );
}