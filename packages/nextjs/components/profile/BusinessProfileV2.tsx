"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useBusinessProfile, useBusinessProfileStats } from '../../lib/hooks/useProfiles';
import { useAuth } from '../../lib/auth/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { SocialLinks } from './SocialLinks';
import { BusinessProfileEditForm } from './BusinessProfileEditForm';

interface BusinessProfileV2Props {
  businessId: string;
}

/**
 * Enhanced business profile component that displays business information
 * and provides editing capabilities for the business owner
 */
export function BusinessProfileV2({ businessId }: BusinessProfileV2Props) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'services'>('about');
  
  // Fetch business profile data
  const { 
    data: business, 
    isLoading, 
    error,
    refetch
  } = useBusinessProfile(businessId);
  
  // Fetch business stats
  const {
    data: stats
  } = useBusinessProfileStats(businessId);
  
  // Check if the current user is the business owner
  const isOwner = user?.id === business?.user_id;
  
  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Business Profile"
        onRetry={() => refetch()}
      />
    );
  }
  
  if (!business) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Business Not Found</h2>
        <p className="mt-2 text-gray-600">
          The business profile you&apos;re looking for could not be found.
        </p>
      </div>
    );
  }
  
  // Display mode
  if (!isEditing) {
    return (
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Banner Image */}
        <div className="relative h-48 w-full bg-gradient-to-r from-blue-400 to-indigo-500">
          {business.banner_image_url && (
            <Image
              src={business.banner_image_url}
              alt={business.business_name}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          )}
        </div>
        
        {/* Business Header */}
        <div className="relative px-6 pb-6">
          {/* Logo */}
          <div className="absolute -top-16 left-6">
            <div className="relative h-32 w-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.business_name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-blue-100 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Edit Button (only shown to owner) */}
          {isOwner && (
            <div className="absolute top-4 right-6">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Edit Business
              </button>
            </div>
          )}
          
          {/* Business Info */}
          <div className="mt-20">
            <h1 className="text-2xl font-bold text-gray-900">
              {business.business_name}
            </h1>
            
            <p className="text-gray-500">{business.business_type}</p>
            
            {/* Business Stats */}
            <div className="mt-6 flex space-x-6">
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{stats?.portfolio_count || 0}</span>
                <span className="text-sm text-gray-500">Projects</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{stats?.follower_count || 0}</span>
                <span className="text-sm text-gray-500">Followers</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-gray-900">{stats?.rating_average.toFixed(1) || '0.0'}</span>
                <span className="text-sm text-gray-500">Rating ({stats?.rating_count || 0})</span>
              </div>
            </div>
            
            {/* Subscription Badge */}
            <div className="mt-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                business.subscription_tier === 'standard' ? 'bg-blue-100 text-blue-800' :
                business.subscription_tier === 'pro' ? 'bg-purple-100 text-purple-800' :
                'bg-gold-100 text-gold-800'
              }`}>
                {business.subscription_tier.charAt(0).toUpperCase() + business.subscription_tier.slice(1)} Plan
              </span>
            </div>
            
            {/* Social Links */}
            {business.social_links && business.social_links.length > 0 && (
              <div className="mt-6">
                <SocialLinks links={business.social_links} />
              </div>
            )}
            
            {/* Tabs Navigation */}
            <div className="mt-8 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'about'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'portfolio'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'services'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  Services
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="py-6">
              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  {/* Description */}
                  {business.description && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">About</h3>
                      <div className="mt-2 text-gray-700 whitespace-pre-line">
                        {business.description}
                      </div>
                    </div>
                  )}
                  
                  {/* Specialties */}
                  {business.specialties && business.specialties.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Specialties</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {business.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      {business.contact_info.email && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">{business.contact_info.email}</dd>
                        </div>
                      )}
                      {business.contact_info.phone && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">{business.contact_info.phone}</dd>
                        </div>
                      )}
                      {business.website_url && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Website</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {business.website_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {business.location && (
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Location</dt>
                          <dd className="mt-1 text-sm text-gray-900">{business.location}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {/* Google Maps Business Listing */}
                  {business.google_maps_url && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Google Business Listing</h3>
                      <div className="mt-2">
                        <a
                          href={business.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                          View on Google Maps
                        </a>
                        <p className="mt-2 text-sm text-gray-500">
                          Visit our Google Business listing for hours, reviews, and directions
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Portfolio</h3>
                  <p className="mt-2 text-gray-500">
                    Portfolio content will be implemented in the next phase.
                  </p>
                </div>
              )}
              
              {/* Services Tab */}
              {activeTab === 'services' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Services</h3>
                  
                  {business.services && business.services.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {business.services.map((service) => (
                        <div key={service.id} className="bg-gray-50 p-4 rounded-md">
                          <h4 className="text-md font-medium text-gray-900">{service.name}</h4>
                          {service.description && (
                            <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                          )}
                          {service.price_range && (
                            <p className="mt-2 text-sm font-medium text-gray-900">
                              {service.price_range.min} - {service.price_range.max} {service.price_range.currency}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-gray-500">
                      No services listed yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Edit mode
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Business Profile</h2>
        <BusinessProfileEditForm 
          business={business} 
          onCancel={() => setIsEditing(false)} 
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    </div>
  );
}