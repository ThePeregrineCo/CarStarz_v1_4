-- Simplified Identity Registry Schema
-- This file contains the necessary SQL to set up the identity registry system
-- Simplified to avoid trigger conflicts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the identity_registry table
DROP TABLE IF EXISTS identity_registry CASCADE;
CREATE TABLE identity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  normalized_wallet TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  email TEXT,
  ens_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_identity_registry_wallet_address ON identity_registry(wallet_address);
CREATE INDEX idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);
CREATE INDEX idx_identity_registry_username ON identity_registry(username);

-- Create the follows table
DROP TABLE IF EXISTS follows CASCADE;
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_wallet TEXT NOT NULL,
  followed_wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_wallet, followed_wallet)
);

-- Create indexes for faster lookups
CREATE INDEX idx_follows_follower_wallet ON follows(follower_wallet);
CREATE INDEX idx_follows_followed_wallet ON follows(followed_wallet);

-- Create the social_links table
DROP TABLE IF EXISTS social_links CASCADE;
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_social_links_wallet_address ON social_links(wallet_address);

-- Insert a test record to verify the table works
INSERT INTO identity_registry (wallet_address, normalized_wallet, username, display_name, bio)
VALUES ('0xTestWallet', '0xtestwallet', 'test_user', 'Test User', 'This is a test user')
ON CONFLICT (username) DO NOTHING;