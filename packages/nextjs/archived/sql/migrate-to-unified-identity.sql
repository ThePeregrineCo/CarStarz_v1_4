-- Migration script to combine users table and identity_registry
-- This script will:
-- 1. Add necessary columns to identity_registry
-- 2. Migrate data from users to identity_registry
-- 3. Update foreign key references
-- 4. Drop the users table

-- Step 1: Add necessary columns to identity_registry
ALTER TABLE identity_registry
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Step 2: Migrate data from users to identity_registry
-- First, handle users that already have entries in identity_registry
UPDATE identity_registry ir
SET 
  username = u.username,
  display_name = u.display_name,
  bio = u.bio,
  profile_image_url = u.profile_image_url,
  banner_image_url = u.banner_image_url,
  email = u.email,
  user_type = u.user_type,
  subscription_tier = u.subscription_tier,
  subscription_start_date = u.subscription_start_date,
  subscription_end_date = u.subscription_end_date,
  location = u.location
FROM users u
WHERE ir.user_id = u.id;

-- Then, insert users that don't have entries in identity_registry
INSERT INTO identity_registry (
  wallet_address,
  normalized_wallet,
  username,
  display_name,
  bio,
  profile_image_url,
  banner_image_url,
  email,
  user_type,
  subscription_tier,
  subscription_start_date,
  subscription_end_date,
  location,
  created_at,
  updated_at
)
SELECT 
  wallet_address,
  LOWER(wallet_address) as normalized_wallet,
  username,
  display_name,
  bio,
  profile_image_url,
  banner_image_url,
  email,
  user_type,
  subscription_tier,
  subscription_start_date,
  subscription_end_date,
  location,
  created_at,
  updated_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM identity_registry ir 
  WHERE ir.normalized_wallet = LOWER(u.wallet_address)
);

-- Step 3: Update foreign key references
-- Update social_links table to reference identity_registry instead of users
ALTER TABLE social_links
  ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Update social_links with wallet_address from users
UPDATE social_links sl
SET wallet_address = u.wallet_address
FROM users u
WHERE sl.user_id = u.id;

-- Create index on wallet_address
CREATE INDEX IF NOT EXISTS idx_social_links_wallet_address ON social_links(wallet_address);

-- Update follows table to reference identity_registry instead of users
ALTER TABLE follows
  ADD COLUMN IF NOT EXISTS follower_wallet TEXT,
  ADD COLUMN IF NOT EXISTS following_wallet TEXT;

-- Update follows with wallet addresses from users
UPDATE follows f
SET 
  follower_wallet = u1.wallet_address,
  following_wallet = u2.wallet_address
FROM users u1, users u2
WHERE f.follower_id = u1.id AND f.following_id = u2.id;

-- Create indexes on wallet addresses
CREATE INDEX IF NOT EXISTS idx_follows_follower_wallet ON follows(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_follows_following_wallet ON follows(following_wallet);

-- Update other tables that reference users (add more as needed)
-- For example, if there's a comments table:
-- ALTER TABLE comments ADD COLUMN IF NOT EXISTS commenter_wallet TEXT;
-- UPDATE comments c SET commenter_wallet = u.wallet_address FROM users u WHERE c.user_id = u.id;

-- Step 4: Drop the users table (only after confirming all data is migrated)
-- This is commented out for safety - uncomment after verifying the migration
-- DROP TABLE users CASCADE;