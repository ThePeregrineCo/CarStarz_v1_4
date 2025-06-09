"use client"

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ClientOnly } from '../../../components/ClientOnly'
import { useQuery } from '@tanstack/react-query'
import { enhancedUserProfilesAdapter } from '../../../lib/types/unifiedIdentity'
import { CreateUserProfileForm } from '../../../components/profile/CreateUserProfileForm'

/**
 * Enhanced User Profile Page
 *
 * This is an enhanced version of the UserProfilePage that uses the Identity Registry
 * for looking up user profiles. It displays additional information from the Identity Registry
 * such as ENS names.
 */
export default function UserProfilePage() {
  const params = useParams()
  const { address } = useAccount()
  // Normalize the address to lowercase
  const userAddress = (params?.address as string || address as string)?.toLowerCase()
  const [activeTab, setActiveTab] = useState('owned')
  
  // Fetch user profile using the enhanced user profiles service
  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['enhanced-user-profile', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      
      console.log('Fetching enhanced profile for address:', userAddress);
      
      try {
        // Use the enhanced user profiles service to get the user profile
        const profile = await enhancedUserProfilesAdapter.getByWalletAddress(userAddress);
        return profile;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!userAddress,
    retry: 1, // Only retry once to avoid infinite loops if there's a persistent error
  });
  
  // Fetch user's owned vehicles using API route
  const { data: profileData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['user-profile', userAddress],
    queryFn: async () => {
      if (!userAddress) return { ownedVehicles: [] };
      
      console.log('Fetching vehicles for address:', userAddress);
      
      const response = await fetch(`/api/user-profiles?address=${userAddress}`, {
        headers: {
          'x-wallet-address': address as string, // Add wallet address to headers
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user profile');
      }
      
      return await response.json();
    },
    enabled: !!userAddress,
  });
  
  // Fetch user's collected vehicles using API route
  const { data: collectionsData, isLoading: isLoadingCollected, refetch: refetchCollections } = useQuery({
    queryKey: ['user-collections', userAddress],
    queryFn: async () => {
      if (!userAddress) return { collections: [] };
      
      console.log('Fetching collections for address:', userAddress);
      
      const response = await fetch(`/api/user-collections?address=${userAddress}`, {
        headers: {
          'x-wallet-address': address as string, // Add wallet address to headers
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user collections');
      }
      
      return await response.json();
    },
    enabled: !!userAddress,
  });
  
  // Fetch users that this user follows using API route
  const { data: followingData, isLoading: isLoadingFollowing, refetch: refetchFollowing } = useQuery({
    queryKey: ['user-following', userAddress],
    queryFn: async () => {
      if (!userAddress) return { following: [] };
      
      console.log('Fetching following for address:', userAddress);
      
      const response = await fetch(`/api/user-follows?address=${userAddress}&type=following`, {
        headers: {
          'x-wallet-address': address as string, // Add wallet address to headers
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch followed users');
      }
      
      return await response.json();
    },
    enabled: !!userAddress,
  });
  
  // Fetch users that follow this user using API route
  const { data: followersData, isLoading: isLoadingFollowers } = useQuery({
    queryKey: ['user-followers', userAddress],
    queryFn: async () => {
      if (!userAddress) return { followers: [] };
      
      console.log('Fetching followers for address:', userAddress);
      
      const response = await fetch(`/api/user-follows?address=${userAddress}&type=followers`, {
        headers: {
          'x-wallet-address': address as string, // Add wallet address to headers
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch followers');
      }
      
      return await response.json();
    },
    enabled: !!userAddress,
  });
  
  // Extract data from API responses
  const ownedVehicles = profileData?.ownedVehicles || [];
  const collectedVehicles = collectionsData?.collections || [];
  const following = followingData?.following || [];
  const followers = followersData?.followers || [];
  
  const isLoading = isLoadingProfile || isLoadingVehicles || isLoadingCollected || isLoadingFollowing || isLoadingFollowers;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If there was an error fetching the profile, log it but continue
  // This allows us to show the profile creation form if needed
  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }
  
  // Since we're already using lowercase addresses, we can simplify the comparison
  const isOwnProfile = address?.toLowerCase() === userAddress;
  
  // If this is the user's own profile and no profile exists yet, show the profile creation form
  if (isOwnProfile && !userProfile) {
    console.log('No profile found for address:', userAddress);
    console.log('Showing profile creation form');
    
    return (
      <ClientOnly>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Create Your Profile</h1>
            <p className="mb-6">
              You need to create a profile before you can mint vehicles. This helps ensure your vehicles are properly linked to your identity.
            </p>
            <p className="mb-6 text-gray-600">
              To create your profile, please fill out the form below. Once your profile is created, you&apos;ll be able to mint vehicles and manage your profile.
            </p>
            <p className="mb-6 text-gray-600">
              If you&apos;re seeing this page, it means you don&apos;t have a profile yet or there was an error fetching your profile.
            </p>
            <CreateUserProfileForm />
          </div>
        </div>
      </ClientOnly>
    );
  }
  
  return (
    <ClientOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {/* User avatar */}
              <img
                src={userProfile?.profile_image_url || `https://effigy.im/a/${userAddress}.svg`}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">{userProfile?.display_name ||
                      userProfile?.ens_name ||
                      (userProfile?.username ? `@${userProfile.username}` : null) ||
                      (userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Unknown User')}</h1>
              {userProfile?.ens_name && userProfile.ens_name !== userProfile.display_name && (
                <p className="text-blue-500">{userProfile.ens_name}</p>
              )}
              <p className="text-gray-500">CARSTARZ Member</p>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <div className="text-center">
              <span className="block text-2xl font-bold">{ownedVehicles?.length || 0}</span>
              <span className="text-gray-500">Vehicles</span>
            </div>
            
            <div className="text-center">
              <span className="block text-2xl font-bold">{collectedVehicles?.length || 0}</span>
              <span className="text-gray-500">Collected</span>
            </div>
            
            <div className="text-center">
              <span className="block text-2xl font-bold">{following?.length || 0}</span>
              <span className="text-gray-500">Following</span>
            </div>
            
            <div className="text-center">
              <span className="block text-2xl font-bold">{followers?.length || 0}</span>
              <span className="text-gray-500">Followers</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 ${activeTab === 'owned' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('owned')}
            >
              Owned
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'collected' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('collected')}
            >
              Collected
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'following' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('following')}
            >
              Following
            </button>
          </div>
        </div>
        
        {activeTab === 'owned' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedVehicles && ownedVehicles.length > 0 ? (
              ownedVehicles.map((vehicle: any) => (
                <Link href={`/vehicle/${vehicle.token_id}`} key={vehicle.token_id} className="block">
                  <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-200">
                      {/* Use vehicle image if available */}
                      {vehicle.vehicle_media && vehicle.vehicle_media.length > 0 ? (
                        <img
                          src={vehicle.vehicle_media[0].url}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg">{vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h3>
                      <p className="text-sm text-gray-500">Token ID: {vehicle.token_id}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-center py-12">No vehicles owned</p>
            )}
          </div>
        )}
        
        {activeTab === 'collected' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collectedVehicles && collectedVehicles.length > 0 ? (
              collectedVehicles.map((vehicle: any) => (
                <div key={vehicle.token_id} className="relative">
                  <Link href={`/vehicle/${vehicle.token_id}`} className="block">
                    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-gray-200">
                        {/* Use vehicle image if available */}
                        {vehicle.vehicle_media && vehicle.vehicle_media.length > 0 ? (
                          <img
                            src={vehicle.vehicle_media[0].url}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg">{vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h3>
                        <p className="text-sm text-gray-500">Token ID: {vehicle.token_id}</p>
                      </div>
                    </div>
                  </Link>
                  {isOwnProfile && (
                    <button
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/user-collections?tokenId=${vehicle.token_id}`, {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-wallet-address': address as string,
                            },
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to remove from collection');
                          }
                          
                          // Refetch collections
                          refetchCollections();
                        } catch (error) {
                          console.error('Error removing from collection:', error);
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="col-span-full text-center py-12">No vehicles collected</p>
            )}
          </div>
        )}
        
        {activeTab === 'following' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {following && following.length > 0 ? (
              following.map((user: any) => (
                <div key={user.followed_wallet} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                  <Link href={`/profile/${user.followed_wallet}`} className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                      <img
                        src={`https://effigy.im/a/${user.followed_wallet}.svg`}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{`${user.followed_wallet.slice(0, 6)}...${user.followed_wallet.slice(-4)}`}</h3>
                    </div>
                  </Link>
                  
                  {isOwnProfile && (
                    <button
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/user-follows?followedWallet=${user.followed_wallet}`, {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-wallet-address': address as string,
                            },
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to unfollow user');
                          }
                          
                          // Refetch following
                          refetchFollowing();
                        } catch (error) {
                          console.error('Error unfollowing user:', error);
                        }
                      }}
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="col-span-full text-center py-12">Not following anyone</p>
            )}
          </div>
        )}
      </div>
    </ClientOnly>
  );
}