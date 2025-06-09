# Identity Registry Setup Guide

This guide provides instructions for setting up the Identity Registry system for CarStarz. The Identity Registry is a crucial component that enables user profiles, vehicle ownership tracking, and proper permissions management.

## Overview

The Identity Registry consists of three main tables:
1. `identity_registry` - Stores user profile information
2. `follows` - Tracks follower relationships between users
3. `social_links` - Stores social media links for users

## Setup Instructions

### Option 1: Using the Setup Script (Recommended)

The simplest way to set up the Identity Registry is to use the provided setup script:

1. Ensure you have the required environment variables set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Run the setup script:
   ```bash
   chmod +x run-identity-setup.sh
   ./run-identity-setup.sh
   ```

3. The script will create all necessary tables, indexes, and functions in your Supabase database.

### Option 2: Using the Setup API

You can also set up the Identity Registry by calling the built-in API endpoint:

1. Start the application with `yarn dev`
2. Make a POST request to the setup endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/setup-identity-registry
   ```

### Option 3: Direct SQL Execution

If you prefer to set up the tables directly in the Supabase dashboard:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `identity-registry-schema.sql` from this repository
4. Paste the SQL into the editor and execute it

## Verifying the Setup

After setting up the Identity Registry, you can verify it's working correctly by:

1. Visiting the profile page for your wallet address (e.g., `/profile/0xYourWalletAddress`)
2. If you don't have a profile yet, you should see a form to create one
3. After creating a profile, you should be able to mint vehicles and manage your profile

## Schema Details

### identity_registry Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| wallet_address | TEXT | The wallet address of the user |
| normalized_wallet | TEXT | Lowercase version of the wallet address for case-insensitive lookups |
| username | TEXT | Unique username for the user |
| display_name | TEXT | Display name for the user |
| bio | TEXT | User biography |
| profile_image_url | TEXT | URL to the user's profile image |
| banner_image_url | TEXT | URL to the user's banner image |
| email | TEXT | User's email address |
| ens_name | TEXT | User's ENS name if available |
| created_at | TIMESTAMPTZ | When the record was created |
| updated_at | TIMESTAMPTZ | When the record was last updated |

### follows Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| follower_wallet | TEXT | The wallet address of the follower |
| followed_wallet | TEXT | The wallet address being followed |
| created_at | TIMESTAMPTZ | When the follow relationship was created |

### social_links Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| wallet_address | TEXT | The wallet address of the user |
| platform | TEXT | The social media platform |
| url | TEXT | The URL to the user's profile on that platform |
| display_name | TEXT | Display name for the link |
| created_at | TIMESTAMPTZ | When the record was created |
| updated_at | TIMESTAMPTZ | When the record was last updated |

## Troubleshooting

If you encounter issues with the Identity Registry:

1. **Table doesn't exist**: Ensure you've executed the setup script or SQL correctly.

2. **Missing columns**: If you see errors about missing columns, it means the table exists but doesn't have the expected schema. Use Option 1 or Option 3 to recreate the tables with the correct schema.

3. **Authentication errors**: Make sure your environment variables are correctly set in `.env.local`.