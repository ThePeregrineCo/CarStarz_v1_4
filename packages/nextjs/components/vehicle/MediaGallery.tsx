"use client"

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useVehicle } from '../../lib/context/VehicleContext'

// Define the media item type
type MediaItem = {
  id: string
  url: string
  type: 'image' | 'video'
  caption: string
  category?: string
  is_featured?: boolean
  metadata?: any
  created_at: string
}

export function MediaGallery() {
  const { vehicle, isOwner } = useVehicle()
  const { address } = useAccount()
  useQueryClient() // Keep the hook for future use
  const [isAdding, setIsAdding] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null)

  const tokenId = vehicle?.token_id || 0

  // Fetch media directly from Supabase
  const { 
    data: mediaItems, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['vehicle-media', tokenId],
    queryFn: async () => {
      try {
        console.log(`Fetching media for vehicle ${tokenId}`);
        
        // Use the API route instead of direct Supabase access
        const response = await fetch(`/api/vehicle-media?tokenId=${tokenId}`, {
          headers: {
            'x-wallet-address': address as string, // Explicitly add wallet address to headers
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch media');
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} media items`);
        return data as MediaItem[];
      } catch (error: any) {
        console.error('Error fetching media:', error)
        setError(`Failed to fetch media: ${error.message}`)
        return []
      }
    },
    enabled: !!tokenId,
  })

  // Reset current index when media items change
  useEffect(() => {
    if (mediaItems && mediaItems.length > 0 && currentIndex >= mediaItems.length) {
      setCurrentIndex(0)
    }
  }, [mediaItems, currentIndex])

  const addMediaMutation = useMutation({
    mutationFn: async (data: { file: File; caption: string; category: string; isFeatured: boolean }) => {
      try {
        // Use the API route instead of direct Supabase access
        console.log(`Sending media upload request for vehicle ${tokenId}`)
        
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('caption', data.caption)
        formData.append('category', 'general') // Default to 'general' as category dropdown was removed
        formData.append('is_featured', data.isFeatured.toString())
        formData.append('tokenId', tokenId.toString())
        
        const response = await fetch('/api/vehicle-media', {
          method: 'POST',
          headers: {
            'x-wallet-address': address as string, // Explicitly add wallet address to headers
          },
          body: formData,
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload media')
        }
        
        const responseData = await response.json()
        console.log('Upload successful:', responseData)
        return responseData
      } catch (error: any) {
        console.error('Error adding media:', error)
        setError(`Failed to add media: ${error.message || 'Unknown error'}`)
        throw error
      }
    },
    onSuccess: () => {
      // Refetch media items
      refetch()
      
      // Reset form
      setIsAdding(false)
      setSelectedFile(null)
      setCaption('')
      setIsFeatured(false)
      setError(null)
    },
  })

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await fetch(`/api/vehicle-media?id=${mediaId}`, {
        method: 'DELETE',
        headers: {
          'x-wallet-address': address as string, // Explicitly add wallet address to headers
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete media')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Refetch media items
      refetch()
      
      // Close the delete modal
      setShowDeleteConfirm(false)
      setMediaToDelete(null)
    },
    onError: (error) => {
      console.error('Error deleting media:', error)
      setError(`Failed to delete media: ${error.message}`)
    }
  })

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (mediaToDelete) {
      deleteMediaMutation.mutate(mediaToDelete.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    addMediaMutation.mutate({
      file: selectedFile,
      caption,
      category: 'general', // Use 'general' as the default category
      isFeatured
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Use the fetched media items
  const media = mediaItems || []
  const currentMedia = media[currentIndex]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading media...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
          Add Media
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Media File
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                setError(null);
                handleFileChange(e);
              }}
              className={`mt-1 block w-full ${error ? 'border-red-500' : ''}`}
              required
            />
            
            {/* Add preview of selected file */}
            {selectedFile && (
              <div className="w-full aspect-video overflow-hidden rounded border mt-2">
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(selectedFile)}
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Caption
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add a caption..."
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
              Set as featured image
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
              disabled={addMediaMutation.isPending || !selectedFile}
            >
              {addMediaMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : 'Upload Media'}
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

      {/* Horizontal scrolling photos section */}
      {media.length > 0 ? (
        <div>
          {/* Main featured image */}
          {currentMedia && (
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
              {currentMedia.type === 'image' ? (
                <img
                  src={currentMedia.url}
                  alt={currentMedia.caption}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={currentMedia.url}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <p className="text-white">{currentMedia.caption}</p>
              </div>
            </div>
          )}

          {/* Horizontal scrolling thumbnails */}
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-2" style={{ minWidth: 'max-content' }}>
              {media.map((item, index) => (
                <div
                  key={item.id}
                  className={`relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer ${
                    index === currentIndex ? 'ring-2 ring-blue-500' : ''
                  } ${item.is_featured ? 'ring-2 ring-yellow-500' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Delete button - only visible on hover and for owners */}
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaToDelete(item);
                        setShowDeleteConfirm(true);
                      }}
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      title="Delete media"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No media available</p>
        </div>
      )}

      {/* Simple Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Media</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this media? This action cannot be undone.
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
                disabled={deleteMediaMutation.isPending}
              >
                {deleteMediaMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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