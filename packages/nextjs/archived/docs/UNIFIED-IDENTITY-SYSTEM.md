# Unified Identity System

This document describes the unified identity system for CarStarz, which uses the `identity_registry` table as the single source of truth for user profiles.

## Overview

The unified identity system replaces the previous approach of having separate `users` and `identity_registry` tables. Instead, all user profile information is stored in the `identity_registry` table, which is linked to other tables via the wallet address.

## Database Schema

### identity_registry

The `identity_registry` table is the central table for user profiles:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| wallet_address | TEXT | User's wallet address |
| normalized_wallet | TEXT | Lowercase wallet address for case-insensitive lookups |
| username | TEXT | Unique username |
| display_name | TEXT | User's display name |
| bio | TEXT | User's bio |
| profile_image_url | TEXT | URL to user's profile image |
| banner_image_url | TEXT | URL to user's banner image |
| email | TEXT | User's email |
| ens_name | TEXT | User's ENS name |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Related Tables

The following tables are linked to the `identity_registry` table via the wallet address:

- `social_links`: User's social media links
- `follows`: User follow relationships
- `vehicle_profiles`: Vehicle profiles owned by users

## API

The unified identity system provides a consistent API for working with user profiles:

### unifiedProfileQueries.ts

This module provides methods for working with user profiles:

- `getByWalletAddress(walletAddress)`: Get a user profile by wallet address
- `getByUsername(username)`: Get a user profile by username
- `update(walletAddress, data)`: Update a user profile
- `create(data)`: Create a new user profile
- `isUsernameAvailable(username)`: Check if a username is available
- `getFollowers(walletAddress)`: Get a user's followers
- `getFollowing(walletAddress)`: Get users that a user is following
- `follow(followerWallet, followedWallet)`: Follow a user
- `unfollow(followerWallet, followedWallet)`: Unfollow a user

## Vehicle Profiles

Vehicle profiles are linked to the `identity_registry` table via the `owner_wallet` field. The `vehicleQueriesV3` module provides methods for working with vehicle profiles that are compatible with the unified identity system.

## Setup

To set up the unified identity system, run the following command:

```bash
cd packages/nextjs
./run-identity-setup.sh
```

This will create the necessary tables in your Supabase database.

## Migration

If you have existing data in the `users` table, you can migrate it to the `identity_registry` table using the migration scripts provided.

## Implementation Details

### Row-Level Security (RLS)

The unified identity system uses Row-Level Security (RLS) to ensure that users can only modify their own data. The RLS policies are set up in the SQL schema.

### Triggers

The unified identity system uses triggers to automatically update the `updated_at` field when a record is updated.

### Indexes

The unified identity system uses indexes to improve query performance:

- `idx_identity_registry_wallet_address`: Index on `wallet_address`
- `idx_identity_registry_normalized_wallet`: Index on `normalized_wallet`
- `idx_identity_registry_username`: Index on `username`

## Usage in Components

The unified identity system provides React hooks for working with user profiles:

- `useVehicleDataV3`: Hook for fetching vehicle data
- `useVehiclesV3`: Hook for fetching multiple vehicles
- `useVehiclesByBuilderV3`: Hook for fetching vehicles by builder
- `useFeaturedVehiclesV3`: Hook for fetching featured vehicles

These hooks are used in the `VehicleProfileV3` component to display vehicle profiles.

## Troubleshooting

If you encounter issues with the unified identity system, you can check the database tables using the `check-db-tables-v2.mjs` script:

```bash
cd packages/nextjs
node check-db-tables-v2.mjs
```

This will show you the tables that exist in the database and their contents.