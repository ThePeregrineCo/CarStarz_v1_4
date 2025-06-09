import React, { useState } from 'react';
import { useUpdateBusinessProfile } from '../../lib/hooks/useProfiles';
import type { BusinessProfile, SocialLink } from '../../lib/types/profiles';

interface BusinessProfileEditFormProps {
  business: BusinessProfile;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * Form component for editing business profile information
 */
export function BusinessProfileEditForm({ business, onCancel, onSuccess }: BusinessProfileEditFormProps) {
  const [formData, setFormData] = useState({
    business_name: business.business_name,
    business_type: business.business_type,
    description: business.description || '',
    logo_url: business.logo_url || '',
    banner_image_url: business.banner_image_url || '',
    contact_info: {
      email: business.contact_info.email || '',
      phone: business.contact_info.phone || '',
      address: business.contact_info.address || {}
    },
    specialties: business.specialties || [],
    website_url: business.website_url || '',
    google_maps_url: business.google_maps_url || '',
    social_links: business.social_links || [],
    location: business.location || ''
  });
  
  const [socialLinkInput, setSocialLinkInput] = useState({
    platform: 'instagram' as SocialLink['platform'],
    url: '',
    display_name: ''
  });
  
  const [specialtyInput, setSpecialtyInput] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateMutation = useUpdateBusinessProfile(business.id);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle contact info changes
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [name]: value
      }
    }));
  };
  
  
  // Add a social link
  const handleAddSocialLink = () => {
    // Validate URL
    if (!socialLinkInput.url) {
      setErrors(prev => ({ ...prev, socialLinkUrl: 'URL is required' }));
      return;
    }
    
    // Check if URL is valid
    let isValidUrl = false;
    try {
      new URL(socialLinkInput.url);
      isValidUrl = true;
    } catch {
      isValidUrl = false;
    }
    
    if (!isValidUrl) {
      setErrors(prev => ({ ...prev, socialLinkUrl: 'Invalid URL' }));
      return;
    }
    
    // Add the social link
    setFormData(prev => ({
      ...prev,
      social_links: [
        ...prev.social_links,
        {
          platform: socialLinkInput.platform,
          url: socialLinkInput.url,
          display_name: socialLinkInput.display_name || undefined
        }
      ]
    }));
    
    // Reset the input
    setSocialLinkInput({
      platform: 'instagram',
      url: '',
      display_name: ''
    });
    
    // Clear any errors
    if (errors.socialLinkUrl) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.socialLinkUrl;
        return newErrors;
      });
    }
  };
  
  // Remove a social link
  const handleRemoveSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };
  
  // Add a specialty
  const handleAddSpecialty = () => {
    if (!specialtyInput.trim()) {
      setErrors(prev => ({ ...prev, specialty: 'Specialty cannot be empty' }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, specialtyInput.trim()]
    }));
    
    setSpecialtyInput('');
    
    // Clear any errors
    if (errors.specialty) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.specialty;
        return newErrors;
      });
    }
  };
  
  // Remove a specialty
  const handleRemoveSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }
    
    if (!formData.business_type.trim()) {
      newErrors.business_type = 'Business type is required';
    }
    
    // Validate Google Maps URL if provided
    if (formData.google_maps_url && !formData.google_maps_url.includes('google.com/maps')) {
      newErrors.google_maps_url = 'Please enter a valid Google Maps URL';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await updateMutation.mutateAsync(formData);
      onSuccess();
    } catch (error) {
      console.error('Error updating business profile:', error);
      setErrors({ form: 'Failed to update business profile. Please try again.' });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display general form error if any */}
      {errors.form && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {errors.form}
        </div>
      )}
      
      {/* Business Name */}
      <div>
        <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
          Business Name *
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="business_name"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.business_name ? 'border-red-300' : ''
            }`}
            required
          />
          {errors.business_name && (
            <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>
          )}
        </div>
      </div>
      
      {/* Business Type */}
      <div>
        <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">
          Business Type *
        </label>
        <div className="mt-1">
          <select
            id="business_type"
            name="business_type"
            value={formData.business_type}
            onChange={handleChange}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.business_type ? 'border-red-300' : ''
            }`}
            required
          >
            <option value="">Select a business type</option>
            <option value="Mechanic">Mechanic</option>
            <option value="Body Shop">Body Shop</option>
            <option value="Dealership">Dealership</option>
            <option value="Performance Shop">Performance Shop</option>
            <option value="Detailing">Detailing</option>
            <option value="Parts Store">Parts Store</option>
            <option value="Custom Builder">Custom Builder</option>
            <option value="Other">Other</option>
          </select>
          {errors.business_type && (
            <p className="mt-1 text-sm text-red-600">{errors.business_type}</p>
          )}
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Tell customers about your business..."
          />
        </div>
      </div>
      
      {/* Logo URL */}
      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
          Logo URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="https://example.com/logo.jpg"
          />
        </div>
      </div>
      
      {/* Banner Image URL */}
      <div>
        <label htmlFor="banner_image_url" className="block text-sm font-medium text-gray-700">
          Banner Image URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="banner_image_url"
            name="banner_image_url"
            value={formData.banner_image_url}
            onChange={handleChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="https://example.com/banner.jpg"
          />
        </div>
      </div>
      
      {/* Google Maps URL */}
      <div>
        <label htmlFor="google_maps_url" className="block text-sm font-medium text-gray-700">
          Google Maps Business Listing URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="google_maps_url"
            name="google_maps_url"
            value={formData.google_maps_url}
            onChange={handleChange}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.google_maps_url ? 'border-red-300' : ''
            }`}
            placeholder="https://www.google.com/maps/place/YourBusinessName"
          />
          {errors.google_maps_url && (
            <p className="mt-1 text-sm text-red-600">{errors.google_maps_url}</p>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Paste the URL from your Google Business listing to show hours, reviews, and directions
        </p>
      </div>
      
      {/* Website URL */}
      <div>
        <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
          Website URL
        </label>
        <div className="mt-1">
          <input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="https://example.com"
          />
        </div>
      </div>
      
      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="City, State"
          />
        </div>
      </div>
      
      {/* Contact Info */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        
        <div className="mt-3 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.contact_info.email}
                onChange={handleContactInfoChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <div className="mt-1">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.contact_info.phone}
                onChange={handleContactInfoChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Specialties
        </label>
        
        {/* Existing specialties */}
        {formData.specialties.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.specialties.map((specialty, index) => (
              <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm">
                <span>{specialty}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpecialty(index)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add new specialty */}
        <div className="mt-3 flex">
          <input
            type="text"
            value={specialtyInput}
            onChange={(e) => setSpecialtyInput(e.target.value)}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-l-md ${
              errors.specialty ? 'border-red-300' : ''
            }`}
            placeholder="Add a specialty (e.g., Engine Swaps, Custom Paint)"
          />
          <button
            type="button"
            onClick={handleAddSpecialty}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        {errors.specialty && (
          <p className="mt-1 text-sm text-red-600">{errors.specialty}</p>
        )}
      </div>
      
      {/* Social Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Social Links
        </label>
        
        {/* Existing social links */}
        {formData.social_links.length > 0 && (
          <div className="mt-2 space-y-2">
            {formData.social_links.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div>
                  <span className="font-medium capitalize">{link.platform}</span>
                  <span className="ml-2 text-sm text-gray-500">{link.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add new social link */}
        <div className="mt-3 grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <select
              value={socialLinkInput.platform}
              onChange={(e) => setSocialLinkInput(prev => ({ ...prev, platform: e.target.value as SocialLink['platform'] }))}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-7">
            <input
              type="url"
              value={socialLinkInput.url}
              onChange={(e) => setSocialLinkInput(prev => ({ ...prev, url: e.target.value }))}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.socialLinkUrl ? 'border-red-300' : ''
              }`}
              placeholder="https://example.com/profile"
            />
            {errors.socialLinkUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.socialLinkUrl}</p>
            )}
          </div>
          <div className="col-span-2">
            <button
              type="button"
              onClick={handleAddSocialLink}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full"
            >
              Add
            </button>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}