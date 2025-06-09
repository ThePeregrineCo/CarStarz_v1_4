"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useAccount } from 'wagmi';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
  });
  
  const [headshot, setHeadshot] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setHeadshot(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
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
    
    if (!formData.username || !formData.bio) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // First, check if the identity registry is set up
      console.log('Checking if identity registry exists...');
      const checkResponse = await fetch('/api/setup-identity-registry');
      const checkData = await checkResponse.json();
      
      console.log('Identity registry check result:', checkData);
      
      if (!checkData.exists) {
        console.log('Identity registry does not exist, setting it up...');
        // Set up the identity registry
        const setupResponse = await fetch('/api/setup-identity-registry', {
          method: 'POST',
        });
        
        if (!setupResponse.ok) {
          const setupError = await setupResponse.json();
          console.error('Failed to set up identity registry:', setupError);
          throw new Error(setupError.error || 'Failed to set up identity registry');
        }
        
        console.log('Identity registry set up successfully');
      } else {
        console.log('Identity registry already exists');
      }
      
      // Now create the user profile
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('bio', formData.bio);
      
      if (headshot) {
        formDataToSend.append('headshot', headshot);
      }
      
      // Send the data to the API
      console.log('Creating user profile...');
      const response = await fetch('/api/user-profiles', {
        method: 'POST',
        headers: {
          'x-wallet-address': address,
        },
        body: formDataToSend,
      });
      
      console.log('User profile creation response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create profile:', errorData);
        
        // If the error is about the identity registry not existing, try to set it up again
        if (errorData.code === 'TABLE_NOT_FOUND') {
          console.log('Identity registry table not found, trying to set it up again...');
          
          // Set up the identity registry again
          const setupResponse = await fetch('/api/setup-identity-registry', {
            method: 'POST',
          });
          
          if (!setupResponse.ok) {
            const setupError = await setupResponse.json();
            console.error('Failed to set up identity registry:', setupError);
            throw new Error(setupError.error || 'Failed to set up identity registry');
          }
          
          console.log('Identity registry set up successfully, trying to create profile again...');
          
          // Try to create the profile again
          const retryResponse = await fetch('/api/user-profiles', {
            method: 'POST',
            headers: {
              'x-wallet-address': address,
            },
            body: formDataToSend,
          });
          
          if (!retryResponse.ok) {
            const retryErrorData = await retryResponse.json();
            console.error('Failed to create profile on retry:', retryErrorData);
            throw new Error(retryErrorData.error || 'Failed to create profile');
          }
          
          // No need to call retryResponse.json() again if we're not using the data
          // The body stream can only be read once
        } else {
          throw new Error(errorData.error || 'Failed to create profile');
        }
      } else {
        // We don't need the response data since we're using the form data for preview
        await response.json();
      }
      
      // No need to call response.json() again - it was already called above
      // The body stream can only be read once
      
      // Set preview data
      setPreviewProfile({
        username: formData.username,
        bio: formData.bio,
        profile_image_url: imagePreview,
      });
      setSuccess(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Show success screen with profile preview
  if (success && previewProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">Profile Created!</h2>
          
          <div className="flex flex-col items-center mb-6">
            {imagePreview ? (
              <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4">
                <Image
                  src={imagePreview}
                  alt="Profile"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-500">
                  {previewProfile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <h3 className="text-xl font-semibold">{previewProfile.username}</h3>
            <p className="text-gray-500 text-sm mb-4">{address?.substring(0, 6)}...{address?.substring(38)}</p>
            
            <p className="text-center text-gray-700">{previewProfile.bio}</p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username*
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Choose a username"
              required
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio*
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview ? (
                <div className="relative h-16 w-16 rounded-full overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Profile Preview"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              
              <div className="flex-1">
                <input
                  type="file"
                  id="headshot"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};