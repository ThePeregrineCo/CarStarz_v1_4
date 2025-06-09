"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useVehicle } from '../../lib/context/VehicleContext'
import { vehicleQueries, VehicleVideo, CompleteVehicleProfile } from '../../lib/api/vehicleQueries'

// Use the VehicleVideo interface from vehicleQueries.unified.ts

interface VideoSectionProps {
  tokenId?: string | number;
  isOwner?: boolean;
}

export function VideoSection({ tokenId: propTokenId, isOwner: propIsOwner }: VideoSectionProps) {
  const vehicleContext = useVehicle()
  // Use the isOwner prop if provided, otherwise use the one from context
  const isOwner = propIsOwner !== undefined ? propIsOwner : vehicleContext.isOwner
  const { vehicle } = vehicleContext
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newVideo, setNewVideo] = useState({
    title: '',
    youtube_url: '',
    description: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  // Use the token ID from props if available, otherwise fall back to the one from context
  const tokenId = propTokenId || vehicle?.token_id || 0
  
  // Fetch videos using vehicleQueries
  const { data: fetchedVideos, refetch: refetchVideos } = useQuery({
    queryKey: ['videos', tokenId],
    queryFn: async () => {
      try {
        console.log('Fetching videos using vehicleQueries...');
        return await vehicleQueries.getVehicleVideos(tokenId.toString());
      } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }
    },
    // Add these options to ensure the query is always fresh
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Consider data stale immediately
    enabled: !!tokenId, // Only run if tokenId is available
  });
  
  // Use the fetched videos if available, otherwise fall back to the videos from the vehicle profile
  const videos = fetchedVideos || ((vehicle as CompleteVehicleProfile)?.vehicle_videos || []);
  
  // Effect to refetch videos when tokenId changes
  useEffect(() => {
    if (tokenId) {
      refetchVideos();
    }
  }, [tokenId, refetchVideos]);
  
  const addVideoMutation = useMutation({
    mutationFn: async (video: typeof newVideo) => {
      try {
        // Use the API route instead of direct Supabase access
        console.log(`Sending video add request for vehicle ${tokenId}`);
        console.log(`Using wallet address: ${address}`);
        
        // Include wallet address in the query params as a fallback authentication method
        const response = await fetch(`/api/vehicle-videos?tokenId=${tokenId}&wallet=${address}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': address as string, // Explicitly add wallet address to headers
          },
          body: JSON.stringify(video),
          credentials: 'include', // Include cookies for authentication
        });
        
        // Log the response status
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to add video');
        }
        
        const responseData = await response.json();
        console.log('Video add successful:', responseData);
        
        // Force a delay to ensure the database has time to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Extract the video data from the response
        // The API returns { success: true, data: {...video} }
        return responseData.data || responseData;
      } catch (error: any) {
        console.error('Error adding video:', error)
        // Log more detailed error information
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }
        setError(`Failed to add video: ${error.message || 'Unknown error'}. Make sure you're connected with the owner wallet.`)
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Video add success, updating cache with:', data);
      
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenId] });
      queryClient.invalidateQueries({ queryKey: ['videos', tokenId] });
      
      // Force a refetch to ensure we have the latest data
      queryClient.refetchQueries({ queryKey: ['vehicle', tokenId] });
      queryClient.refetchQueries({ queryKey: ['videos', tokenId] });
      
      // Manually refetch videos to ensure we have the latest data
      refetchVideos();
      
      // Reset form state
      setIsAdding(false);
      setNewVideo({
        title: '',
        youtube_url: '',
        description: ''
      });
      setError(null);
      
      // Show success message
      setSuccessMessage(`Video "${data.title || 'New video'}" added successfully!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    },
  });
  
  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      try {
        // Use the API route to delete the video
        console.log(`Sending video delete request for video ${videoId}`);
        console.log(`Using wallet address: ${address}`);
        
        const response = await fetch(`/api/vehicle-videos?id=${videoId}&wallet=${address}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': address as string,
          },
          credentials: 'include', // Include cookies for authentication
        });
        
        // Log the response status
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to delete video');
        }
        
        const responseData = await response.json();
        console.log('Video delete successful:', responseData);
        
        // Force a delay to ensure the database has time to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Extract the data from the response if available
        // The API returns { success: true, data: {...} }
        return responseData.data || responseData;
      } catch (error: any) {
        console.error('Error deleting video:', error);
        setError(`Failed to delete video: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenId] });
      queryClient.invalidateQueries({ queryKey: ['videos', tokenId] });
      
      // Force a refetch to ensure we have the latest data
      queryClient.refetchQueries({ queryKey: ['vehicle', tokenId] });
      queryClient.refetchQueries({ queryKey: ['videos', tokenId] });
      
      // Manually refetch videos to ensure we have the latest data
      refetchVideos();
      
      // Also manually update the UI by removing the deleted video from the fetchedVideos array
      if (fetchedVideos && Array.isArray(fetchedVideos)) {
        const updatedVideos = fetchedVideos.filter(video => video.id !== isDeleting);
        queryClient.setQueryData(['videos', tokenId], updatedVideos);
      }
      
      setIsDeleting(null);
      setSuccessMessage('Video deleted successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    },
  });
  
  // Handle delete button click
  const handleDelete = (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setIsDeleting(videoId);
      deleteVideoMutation.mutate(videoId);
    }
  };
  
  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVideoMutation.mutate(newVideo);
  };
  
  // Check if videos are loading
  const isLoading = fetchedVideos === undefined;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading videos...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Videos</h2>
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
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
              {!address && (
                <p className="mt-2 text-sm font-semibold text-yellow-700">
                  You need to connect your wallet to add videos.
                </p>
              )}
              {address && !isOwner && (
                <p className="mt-2 text-sm font-semibold text-yellow-700">
                  Only the vehicle owner can add videos.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isOwner && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          Add Video
        </button>
      )}
      
      {!isOwner && address && (
        <div className="text-sm text-gray-500 mb-4">
          Only the vehicle owner can add videos
        </div>
      )}
      
      {!address && (
        <div className="text-sm text-gray-500 mb-4">
          Connect your wallet to add videos
        </div>
      )}
      
      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={newVideo.title}
              onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              YouTube URL
            </label>
            <input
              type="url"
              value={newVideo.youtube_url}
              onChange={(e) => setNewVideo(prev => ({ ...prev, youtube_url: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={newVideo.description}
              onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
              disabled={addVideoMutation.isPending}
            >
              {addVideoMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : 'Add Video'}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos && videos.length > 0 ? (
          videos.map((video: VehicleVideo) => {
            const videoId = getYoutubeVideoId(video.youtube_url);
            const isBeingDeleted = isDeleting === video.id;
            
            return (
              <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden">
                {videoId && (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={video.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{video.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(video.date || video.created_at)}</p>
                    </div>
                    
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(video.id)}
                        disabled={isBeingDeleted}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                        title="Delete video"
                      >
                        {isBeingDeleted ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{video.description}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No videos available</p>
          </div>
        )}
      </div>
    </div>
  );
}