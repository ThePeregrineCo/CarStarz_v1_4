"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useClubProfile, useClubProfileStats } from '../../lib/hooks/useProfiles';
import { useAuth } from '../../lib/auth/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { SocialLinks } from './SocialLinks';

interface ClubProfileV2Props {
  clubId: string;
}

/**
 * Enhanced club profile component that displays club information
 * and provides editing capabilities for the club creator
 */
export function ClubProfileV2({ clubId }: ClubProfileV2Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'about' | 'members' | 'vehicles' | 'events'>('about');
  
  // Fetch club profile data
  const { 
    data: club, 
    isLoading, 
    error,
    refetch
  } = useClubProfile(clubId);
  
  // Fetch club stats
  const {
    data: stats
  } = useClubProfileStats(clubId);
  
  // Check if the current user is the club creator
  const isCreator = user?.id === club?.creator_id;
  
  if (isLoading) {
    return <LoadingSpinner size="large" />;
  }
  
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Club Profile"
        onRetry={() => refetch()}
      />
    );
  }
  
  if (!club) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Club Not Found</h2>
        <p className="mt-2 text-gray-600">
          The club profile you&apos;re looking for could not be found.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden">
      {/* Banner Image */}
      <div className="relative h-48 w-full bg-gradient-to-r from-indigo-400 to-purple-500">
        {club.banner_image_url && (
          <Image
            src={club.banner_image_url}
            alt={club.club_name}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        )}
      </div>
      
      {/* Club Header */}
      <div className="relative px-6 pb-6">
        {/* Logo */}
        <div className="absolute -top-16 left-6">
          <div className="relative h-32 w-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
            {club.logo_url ? (
              <Image
                src={club.logo_url}
                alt={club.club_name}
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-indigo-100 text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Edit Button (only shown to creator) */}
        {isCreator && (
          <div className="absolute top-4 right-6">
            <button
              onClick={() => alert('Club editing will be implemented in the next phase')}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
            >
              Edit Club
            </button>
          </div>
        )}
        
        {/* Club Info */}
        <div className="mt-20">
          <h1 className="text-2xl font-bold text-gray-900">
            {club.club_name}
          </h1>
          
          {/* Private badge */}
          {club.is_private && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2">
              Private
            </span>
          )}
          
          {/* Club Stats */}
          <div className="mt-6 flex space-x-6">
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{stats?.member_count || 0}</span>
              <span className="text-sm text-gray-500">Members</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{stats?.vehicle_count || 0}</span>
              <span className="text-sm text-gray-500">Vehicles</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{stats?.event_count || 0}</span>
              <span className="text-sm text-gray-500">Events</span>
            </div>
          </div>
          
          {/* Social Links */}
          {club.social_links && club.social_links.length > 0 && (
            <div className="mt-6">
              <SocialLinks links={club.social_links} />
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
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'members'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'vehicles'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Vehicles
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'events'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Events
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="py-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Description */}
                {club.description && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">About</h3>
                    <div className="mt-2 text-gray-700 whitespace-pre-line">
                      {club.description}
                    </div>
                  </div>
                )}
                
                {/* Club Rules */}
                {club.club_rules && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Club Rules</h3>
                    <div className="mt-2 text-gray-700 whitespace-pre-line">
                      {club.club_rules}
                    </div>
                  </div>
                )}
                
                {/* Membership Requirements */}
                {club.membership_requirements && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Membership Requirements</h3>
                    <div className="mt-2 text-gray-700 whitespace-pre-line">
                      {club.membership_requirements}
                    </div>
                  </div>
                )}
                
                {/* Location */}
                {club.location && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Location</h3>
                    <div className="mt-2 text-gray-700">
                      {club.location}
                    </div>
                  </div>
                )}
                
                {/* Founding Date */}
                {club.founding_date && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Founded</h3>
                    <div className="mt-2 text-gray-700">
                      {new Date(club.founding_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Members</h3>
                <p className="mt-2 text-gray-500">
                  Member listing will be implemented in the next phase.
                </p>
              </div>
            )}
            
            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Club Vehicles</h3>
                <p className="mt-2 text-gray-500">
                  Vehicle listing will be implemented in the next phase.
                </p>
              </div>
            )}
            
            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Events</h3>
                <p className="mt-2 text-gray-500">
                  Event listing will be implemented in the next phase.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}