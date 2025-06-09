import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleQueries } from '../api/vehicleQueries';
import type { CompleteVehicleProfile } from '../api/vehicleQueries';

/**
 * Hook for updating vehicle profile data
 * @param tokenId The NFT token ID of the vehicle
 */
export function useUpdateVehicle(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: (data: Partial<CompleteVehicleProfile>) => 
      vehicleQueries.updateVehicleProfile(tokenIdStr, data),
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
    },
  });
}

/**
 * Hook for adding media to a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useAddMedia(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: (formData: FormData) => {
      // Ensure tokenId is included in the form data
      if (!formData.has('tokenId')) {
        formData.append('tokenId', tokenIdStr);
      }
      return fetch('/api/vehicle-media', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Failed to upload media');
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
    },
  });
}

/**
 * Hook for adding a part to a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useAddPart(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: async (partData: {
      category: string;
      description?: string;
      link?: string;
      image?: File;
    }) => {
      try {
        const result = await vehicleQueries.addPart(tokenIdStr, {
          category: partData.category,
          description: partData.description || '',
          link: partData.link,
          image: partData.image
        });
        
        if (!result) {
          throw new Error('Failed to add part');
        }
        
        return result;
      } catch (error) {
        console.error('Error in useAddPart:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr, 'parts'] });
    },
  });
}

/**
 * Hook for adding a video to a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useAddVideo(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: async (videoData: {
      title: string;
      youtube_url: string;
      description?: string;
      date?: string;
    }) => {
      try {
        const result = await vehicleQueries.addVideo(tokenIdStr, videoData);
        
        if (!result) {
          throw new Error('Failed to add video');
        }
        
        return result;
      } catch (error) {
        console.error('Error in useAddVideo:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr, 'videos'] });
    },
  });
}

/**
 * Hook for adding a builder to a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useAddBuilder(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: (builderData: {
      builderId: string;
      buildDate?: string;
      buildDescription?: string;
    }) => {
      return fetch(`/api/vehicle-builders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: tokenIdStr,
          ...builderData,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to add builder');
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
    },
  });
}

/**
 * Hook for adding a specification to a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useAddSpecification(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: (specData: {
      category: string;
      name: string;
      value: string;
    }) => {
      return fetch(`/api/vehicle-specifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: tokenIdStr,
          ...specData,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to add specification');
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
    },
  });
}

/**
 * Hook for adding a link to a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useAddLink(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: (linkData: {
      title: string;
      url: string;
      type: string;
      icon?: string;
    }) => {
      return fetch(`/api/vehicle-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: tokenIdStr,
          ...linkData,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to add link');
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
    },
  });
}

/**
 * Hook for deleting media from a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useDeleteMedia(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: (mediaId: string) => {
      return fetch(`/api/vehicle-media?id=${mediaId}&tokenId=${tokenIdStr}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => {
        if (!res.ok) throw new Error('Failed to delete media');
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
    },
  });
}

/**
 * Hook for updating media for a vehicle
 * @param tokenId The NFT token ID of the vehicle
 */
export function useUpdateMedia(tokenId: string | number) {
  const queryClient = useQueryClient();
  const tokenIdStr = tokenId.toString();
  
  return useMutation({
    mutationFn: (data: {
      mediaId: string;
      caption?: string;
      category?: string;
      is_featured?: boolean;
    }) => {
      const { mediaId, ...updateData } = data;
      return fetch(`/api/vehicle-media?id=${mediaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: tokenIdStr,
          ...updateData,
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update media');
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch queries related to this vehicle
      queryClient.invalidateQueries({ queryKey: ['vehicle', tokenIdStr] });
    },
  });
}