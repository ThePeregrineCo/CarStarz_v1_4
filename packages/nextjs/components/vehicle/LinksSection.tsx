"use client";

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useVehicle } from '../../lib/context/VehicleContext'

interface Link {
  id: string
  title: string
  url: string
  type: string
  icon?: string
}

export function LinksSection() {
  const { vehicle, isLoading, isOwner, refetch } = useVehicle()
  const [isAdding, setIsAdding] = useState(false)
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    type: 'social',
    icon: null as string | null
  })
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null)

  const tokenId = vehicle?.token_id || 0

  // Fetch links directly from Supabase
  const addLinkMutation = useMutation({
    mutationFn: async (link: typeof newLink) => {
      try {
        // Use the API route instead of direct Supabase access
        console.log(`Sending link add request for vehicle ${tokenId}`);
        
        const response = await fetch(`/api/vehicle-links?tokenId=${tokenId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(link),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add link');
        }
        
        const responseData = await response.json();
        console.log('Link add successful:', responseData);
        return responseData;
      } catch (error: any) {
        console.error('Error adding link:', error)
        setError(`Failed to add link: ${error.message || 'Unknown error'}`)
        throw error;
      }
    },
    onSuccess: () => {
      // Refetch vehicle data
      refetch();
      
      // Reset form
      setIsAdding(false);
      setNewLink({
        title: '',
        url: '',
        type: 'social',
        icon: null
      });
      setError(null);
    },
  })

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      try {
        const response = await fetch(`/api/vehicle-links?id=${linkId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete link');
        }
        
        return response.json();
      } catch (error: any) {
        console.error('Error deleting link:', error);
        setError(`Failed to delete link: ${error.message}`);
        throw error;
      }
    },
    onSuccess: () => {
      // Refetch vehicle data
      refetch();
      
      // Close the delete modal
      setShowDeleteConfirm(false);
      setLinkToDelete(null);
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading links...</span>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addLinkMutation.mutate(newLink)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (linkToDelete) {
      deleteLinkMutation.mutate(linkToDelete.id);
    }
  }

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'social':
        return '🔗'
      case 'marketplace':
        return '🛒'
      case 'forum':
        return '💬'
      case 'other':
      default:
        return '🌐'
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Links</h2>
      
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {isOwner && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          Add Link
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={newLink.type}
                onChange={(e) => setNewLink(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="social">Social Media</option>
                <option value="marketplace">Marketplace</option>
                <option value="forum">Forum/Thread</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL
            </label>
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="https://..."
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
              disabled={addLinkMutation.isPending}
            >
              {addLinkMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add Link'}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicle?.vehicle_links?.map((link: Link) => (
          <div 
            key={link.id}
            className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow relative group"
          >
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center flex-grow"
            >
              <span className="text-2xl mr-3">{link.icon || getLinkIcon(link.type)}</span>
              <div>
                <h3 className="font-medium">{link.title}</h3>
                <p className="text-sm text-gray-500 truncate">{link.url}</p>
              </div>
            </a>
            
            {/* Delete button - only visible on hover and for owners */}
            {isOwner && (
              <button
                onClick={() => {
                  setLinkToDelete(link);
                  setShowDeleteConfirm(true);
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {(!vehicle?.vehicle_links || vehicle.vehicle_links.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No links available</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Link</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete &ldquo;{linkToDelete?.title}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleteLinkMutation.isPending}
              >
                {deleteLinkMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}