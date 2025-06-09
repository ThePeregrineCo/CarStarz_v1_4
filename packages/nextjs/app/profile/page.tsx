"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ClientOnly } from '../../components/ClientOnly';
import { CreateUserProfileForm } from '../../components/profile/CreateUserProfileForm';
import { SetupIdentityRegistry } from '../../components/profile/SetupIdentityRegistry';

/**
 * Standalone Profile Page
 * 
 * This page allows users to create a profile without requiring authentication.
 * It redirects users to their profile page if they have a wallet connected.
 */
export default function ProfilePage() {
  const { address } = useAccount();
  const router = useRouter();
  const [registrySetupComplete, setRegistrySetupComplete] = useState(false);
  
  // If the user has a wallet connected, redirect to their profile page
  React.useEffect(() => {
    if (address && registrySetupComplete) {
      router.push(`/profile/${address}`);
    }
  }, [address, router, registrySetupComplete]);
  
  return (
    <ClientOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Create Your Profile</h1>
          
          {/* First, check if the identity registry is set up */}
          <SetupIdentityRegistry
            onSetupComplete={() => setRegistrySetupComplete(true)}
          />
          
          {/* Only show the profile creation form if the registry is set up */}
          {registrySetupComplete && (
            <>
              {!address ? (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-6 mb-6" role="alert">
                  <p className="font-bold">Connect Your Wallet</p>
                  <p>Please connect your wallet to create a profile.</p>
                </div>
              ) : (
                <>
                  <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Create Your Profile</h2>
                    <p className="mb-6">
                      You need to create a profile before you can mint vehicles. This helps ensure your vehicles are properly linked to your identity.
                    </p>
                    <p className="mb-6 text-gray-600">
                      To create your profile, please fill out the form below. Once your profile is created, you&apos;ll be able to mint vehicles and manage your profile.
                    </p>
                    <CreateUserProfileForm
                      onSuccess={() => {
                        if (address) {
                          router.push(`/profile/${address}`);
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}