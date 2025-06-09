"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useVehicle } from '../../lib/context/VehicleContext'

export function DescriptionBlock() {
  const { vehicle, isLoading, isOwner, refetch } = useVehicle()
  const { address } = useAccount()
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState(vehicle?.description || '')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Update local state when vehicle data changes
  useEffect(() => {
    if (vehicle?.description !== description && !editing) {
      setDescription(vehicle?.description || '')
    }
  }, [vehicle, description, editing])

  const handleSave = async () => {
    if (!vehicle) return
    
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      console.log(`Updating description for vehicle ${vehicle.token_id}`);
      console.log(`Using wallet address: ${address}`);
      
      // Use the API route instead of direct Supabase access
      const response = await fetch(`/api/vehicle-profiles?tokenId=${vehicle.token_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address as string, // Explicitly add wallet address to headers
        },
        body: JSON.stringify({ description }),
        credentials: 'include', // Include cookies for authentication
      });
      
      // Log the response status
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update description');
      }
      
      const responseData = await response.json();
      console.log('Description update successful:', responseData);
      
      setEditing(false)
      setSuccessMessage('Description updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      refetch() // Get fresh data
    } catch (err: any) {
      console.error('Error saving description:', err);
      setError(`Error saving description: ${err.message}`);
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading description...</span>
      </div>
    )
  }

  // If no profile, show a message
  if (!vehicle) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded">
        <p>No vehicle profile found. Please create one first.</p>
      </div>
    )
  }

  // Read-only view for non-owners
  if (!isOwner) {
    return (
      <div className="prose max-w-none">
        <h2 className="text-xl font-bold mb-2">About this Vehicle</h2>
        <p className="text-gray-600">
          {vehicle.description || 'No description available.'}
        </p>
      </div>
    )
  }

  // Edit mode for owners
  if (editing) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            placeholder="Tell us about your vehicle..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // View mode for owners
  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="prose max-w-none">
        <h2 className="text-xl font-bold mb-2">About this Vehicle</h2>
        <p className="text-gray-600">
          {description || 'No description available. Click "Edit Description" to add one.'}
        </p>
      </div>
      
      <button
        onClick={() => setEditing(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Edit Description
      </button>
    </div>
  )
}