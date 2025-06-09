"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { enhancedUserProfilesAdapter } from '../../lib/types/unifiedIdentity'
import { EnhancedUserProfile } from '../../lib/types/enhancedProfiles'

interface UserDisplayProps {
  walletAddress?: string
  userId?: string
  username?: string
  showAvatar?: boolean
  showENS?: boolean
  size?: 'sm' | 'md' | 'lg'
  linkToProfile?: boolean
  className?: string
}

/**
 * UserDisplay component
 * 
 * This component displays user information consistently throughout the application.
 * It can display a user's avatar, display name, ENS name, etc.
 * 
 * @param walletAddress The wallet address of the user to display
 * @param userId The user ID of the user to display
 * @param username The username of the user to display
 * @param showAvatar Whether to show the user's avatar
 * @param showENS Whether to show the user's ENS name
 * @param size The size of the component
 * @param linkToProfile Whether to link to the user's profile
 * @param className Additional CSS classes
 */
export const UserDisplay: React.FC<UserDisplayProps> = ({
  walletAddress,
  userId,
  username,
  showAvatar = true,
  showENS = true,
  size = 'md',
  linkToProfile = true,
  className = '',
}) => {
  const [userProfile, setUserProfile] = useState<EnhancedUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true)
      try {
        let profile = null

        if (walletAddress) {
          profile = await enhancedUserProfilesAdapter.getByWalletAddress(walletAddress)
        } else if (userId) {
          // Get the primary wallet for the user ID
          // Note: In the unified identity system, userId is the same as the identity_registry id
          const primaryWallet = userId // In the unified system, userId is the wallet address
          if (primaryWallet) {
            profile = await enhancedUserProfilesAdapter.getByWalletAddress(primaryWallet)
          }
        } else if (username) {
          profile = await enhancedUserProfilesAdapter.getByUsername(username)
        }

        setUserProfile(profile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [walletAddress, userId, username])

  if (isLoading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-full h-6 w-24"></div>
      </div>
    )
  }

  if (!userProfile && !walletAddress) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="text-gray-500">Unknown User</span>
      </div>
    )
  }

  // Use the wallet address if no profile is found
  const address = userProfile?.wallet_address || walletAddress || ''
  
  // Determine the display name
  const displayName = userProfile?.display_name || 
                      userProfile?.ens_name || 
                      (userProfile?.username ? `@${userProfile.username}` : null) || 
                      (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown User')

  // Determine avatar size
  const avatarSizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'
  const textSizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'

  // Create the content
  const content = (
    <div className={`inline-flex items-center ${className}`}>
      {showAvatar && (
        <div className={`${avatarSizeClass} rounded-full bg-gray-200 overflow-hidden mr-2`}>
          <img
            src={userProfile?.profile_image_url || `https://effigy.im/a/${address}.svg`}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div>
        <span className={`font-medium ${textSizeClass}`}>{displayName}</span>
        {showENS && userProfile?.ens_name && userProfile.ens_name !== displayName && (
          <span className="text-blue-500 text-sm ml-1">{userProfile.ens_name}</span>
        )}
      </div>
    </div>
  )

  // Wrap in a link if linkToProfile is true
  if (linkToProfile && address) {
    return (
      <Link href={`/profile/${address}`} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}

/**
 * UserDisplayInline component
 * 
 * A simplified version of UserDisplay for inline use.
 */
export const UserDisplayInline: React.FC<UserDisplayProps> = (props) => {
  return <UserDisplay {...props} showAvatar={false} size="sm" />
}