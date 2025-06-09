"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { registerWalletInIdentityRegistry } from '../../lib/auth/identityService';
import { SetupIdentityRegistry } from './SetupIdentityRegistry';

interface CreateUserProfileFormProps {
  onSuccess?: () => void;
}

export const CreateUserProfileForm: React.FC<CreateUserProfileFormProps> = ({ onSuccess }) => {
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistrySetup, setIsRegistrySetup] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
  });
  
  // Check if the identity registry is set up
  useEffect(() => {
    const checkIdentityRegistry = async () => {
      try {
        const response = await fetch('/api/setup-identity-registry');
        const data = await response.json();
        setIsRegistrySetup(data.exists);
      } catch (error) {
        console.error('Error checking identity registry:', error);
        setIsRegistrySetup(false);
      }
    };
    
    checkIdentityRegistry();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setError('Wallet not connected');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Creating profile for wallet:', address);
      console.log('Form data:', formData);
      
      // First, try to register the wallet in the identity registry
      try {
        console.log('Registering wallet in identity registry...');
        const registrationResult = await registerWalletInIdentityRegistry(address);
        
        if (!registrationResult.success) {
          console.warn('Warning: Failed to register wallet in identity registry:', registrationResult.error);
          // Continue anyway - the identity registry might not exist yet
        } else {
          console.log('Wallet registered successfully in identity registry');
        }
      } catch (registrationError) {
        console.error('Error registering wallet in identity registry:', registrationError);
        // Continue anyway - we'll try to create the profile directly
      }
      
      // Try to create the user profile directly in the database
      try {
        // Create the user profile using the API
        const response = await fetch('/api/user-profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': address,
          },
          body: JSON.stringify({
            username: formData.username,
            display_name: formData.displayName,
            bio: formData.bio,
          }),
        });
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create profile');
          } catch (jsonError) {
            console.error('Error parsing response JSON:', jsonError);
            throw new Error(`Failed to create profile: ${response.status} ${response.statusText}`);
          }
        }
        
        // Success
        console.log('Profile created successfully via API');
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Reload the page to show the new profile
        window.location.reload();
      } catch (apiError) {
        console.error('Error creating profile via API:', apiError);
        
        // If the API fails, show an error message with instructions
        setError(`Failed to create profile. Please make sure the identity registry is set up correctly.
          See the IDENTITY-REGISTRY-SETUP.md file for instructions.`);
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If we're still checking if the registry is set up
  if (isRegistrySetup === null) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Checking Setup...</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // If the registry is not set up, show the setup component
  if (isRegistrySetup === false) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Setup Required</h2>
        <p className="mb-6">Before you can create a profile, the identity registry needs to be set up.</p>
        <SetupIdentityRegistry onSetupComplete={() => setIsRegistrySetup(true)} />
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Your Profile</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Choose a username"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-gray-700 font-medium mb-2">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your display name"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about yourself"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};