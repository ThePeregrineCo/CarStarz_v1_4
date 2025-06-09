-- Unified Identity Schema for CarStarz
-- This script creates a schema that uses the identity_registry as the single source of truth for user profiles

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the enhanced identity_registry table
CREATE TABLE IF NOT EXISTS identity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  normalized_wallet TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  email TEXT,
  user_type TEXT,
  subscription_tier TEXT,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  ens_name TEXT,
  location TEXT,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_identity_registry_wallet_address ON identity_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);

-- Create social_links table that references wallet_address directly
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on wallet_address
CREATE INDEX IF NOT EXISTS idx_social_links_wallet_address ON social_links(wallet_address);

-- Create follows table that references wallet addresses directly
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_wallet TEXT NOT NULL,
  following_wallet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_wallet, following_wallet)
);

-- Create indexes on wallet addresses
CREATE INDEX IF NOT EXISTS idx_follows_follower_wallet ON follows(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_follows_following_wallet ON follows(following_wallet);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_identity_registry_timestamp
BEFORE UPDATE ON identity_registry
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_social_links_timestamp
BEFORE UPDATE ON social_links
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Add RLS policies
ALTER TABLE identity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Allow users to read all identity records
CREATE POLICY "Identity records are viewable by everyone"
  ON identity_registry FOR SELECT
  USING (true);

-- Allow users to update their own identity
CREATE POLICY "Users can update their own identity"
  ON identity_registry FOR UPDATE
  USING (auth.uid()::text = normalized_wallet);

-- Allow users to insert their own identity
CREATE POLICY "Users can insert their own identity"
  ON identity_registry FOR INSERT
  WITH CHECK (auth.uid()::text = normalized_wallet);

-- Allow service role to manage all identities
CREATE POLICY "Service role can manage all identities"
  ON identity_registry
  USING (auth.role() = 'service_role');

-- Social links policies
CREATE POLICY "Social links are viewable by everyone"
  ON social_links FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own social links"
  ON social_links FOR ALL
  USING (auth.uid()::text = wallet_address);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own follows"
  ON follows FOR ALL
  USING (auth.uid()::text = follower_wallet);

-- Update vehicle_profiles to reference wallet_address directly if it doesn't already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicle_profiles' AND column_name = 'owner_wallet'
  ) THEN
    ALTER TABLE vehicle_profiles ADD COLUMN owner_wallet TEXT;
  END IF;
END $$;
