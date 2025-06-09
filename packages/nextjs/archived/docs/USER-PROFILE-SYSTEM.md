# User Profile System

This document explains how the user profile system works and how to integrate it into your application.

## Overview

The user profile system allows users to create profiles with the following information:
- Username
- Bio
- Profile picture

Profiles are stored in the `identity_registry` table in Supabase and are linked to the user's wallet address.

## Setup

Before using the user profile system, you need to set up the required infrastructure:

1. Make sure the identity registry table exists:
   ```bash
   # Check if the identity registry exists
   curl http://localhost:3000/api/setup-identity-registry
   
   # If it doesn't exist, create it
   curl -X POST http://localhost:3000/api/setup-identity-registry
   ```

2. Set up the storage bucket for profile images:
   ```bash
   # Make the script executable
   chmod +x packages/nextjs/run-setup-profile-storage.sh
   
   # Run the script
   ./packages/nextjs/run-setup-profile-storage.sh
   ```

## Components

The user profile system consists of the following components:

### 1. CreateAccountModal

A modal component that displays a form for creating a user profile. It includes fields for username, bio, and a profile picture upload.

```tsx
import { CreateAccountModal } from '../components/profile/CreateAccountModal';

// Usage
<CreateAccountModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={() => {
    // Handle success
  }}
/>
```

### 2. CreateAccountButton

A button component that opens the CreateAccountModal when clicked. This is the main entry point for users to create profiles.

```tsx
import { CreateAccountButton } from '../components/profile/CreateAccountButton';

// Usage
<CreateAccountButton
  className="px-4 py-2 bg-blue-500 text-white rounded-md"
  buttonText="Create Account"
  onSuccess={() => {
    // Handle success
  }}
/>
```

## Integration

To integrate the user profile system into your application:

1. Add the CreateAccountButton to your header or navigation:

```tsx
// In your Header.tsx or similar component
import { CreateAccountButton } from './profile/CreateAccountButton';
import { useAccount } from 'wagmi';

export function Header() {
  const { address, isConnected } = useAccount();
  
  return (
    <header className="flex items-center justify-between p-4">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Your App</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {isConnected ? (
          <CreateAccountButton
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onSuccess={() => {
              // Redirect to profile page or refresh
              window.location.href = `/profile/${address}`;
            }}
          />
        ) : (
          <ConnectButton /> // Your wallet connect button
        )}
      </div>
    </header>
  );
}
```

2. Create a profile page to display user profiles:

```tsx
// In your profile page component
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function ProfilePage() {
  const { address } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/user-profiles?address=${address}`);
        const data = await response.json();
        setProfile(data.userProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (address) {
      fetchProfile();
    }
  }, [address]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!profile) {
    return <div>Profile not found</div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center space-x-4">
        {profile.profile_image_url ? (
          <div className="relative h-24 w-24 rounded-full overflow-hidden">
            <Image
              src={profile.profile_image_url}
              alt={profile.username}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl text-gray-500">
              {profile.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div>
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-gray-500">{profile.wallet_address}</p>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Bio</h2>
        <p className="text-gray-700">{profile.bio || 'No bio provided'}</p>
      </div>
      
      {/* Display owned vehicles */}
      {profile.ownedVehicles && profile.ownedVehicles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Owned Vehicles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.ownedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h3>
                <a href={`/vehicle/${vehicle.token_id}`} className="text-blue-500 hover:underline">
                  View Vehicle
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## API Endpoints

The user profile system uses the following API endpoints:

### 1. POST /api/user-profiles

Creates a new user profile.

**Request:**
- Headers:
  - `x-wallet-address`: The user's wallet address
- Body (JSON):
  ```json
  {
    "username": "username",
    "display_name": "Display Name",
    "bio": "User bio"
  }
  ```
- Body (FormData):
  - `username`: The username
  - `display_name`: (Optional) The display name
  - `bio`: The user's bio
  - `headshot`: (Optional) Profile image file

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "wallet_address": "0x...",
    "normalized_wallet": "0x...",
    "username": "username",
    "display_name": "Display Name",
    "bio": "User bio",
    "profile_image_url": "https://..."
  }
}
```

### 2. GET /api/user-profiles?address=0x...

Gets a user profile by wallet address.

**Response:**
```json
{
  "userProfile": {
    "id": "uuid",
    "wallet_address": "0x...",
    "normalized_wallet": "0x...",
    "username": "username",
    "display_name": "Display Name",
    "bio": "User bio",
    "profile_image_url": "https://..."
  },
  "ownedVehicles": [
    {
      "id": "uuid",
      "token_id": "1",
      "name": "Vehicle Name",
      "make": "Make",
      "model": "Model",
      "year": 2023
    }
  ]
}
```

## Flow

1. User connects their wallet
2. User clicks the "Create Account" button
3. The CreateAccountModal opens
4. User fills in their username, bio, and optionally uploads a profile picture
5. User clicks "Create Account"
6. The form data is sent to the API
7. The API creates a new user profile in the identity_registry table
8. The API returns the created profile
9. The modal shows a success message with a preview of the profile
10. The user clicks "Continue" to close the modal