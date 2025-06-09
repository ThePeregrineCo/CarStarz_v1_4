-- Identity Registry Schema
-- This schema creates the tables for the unified identity system

-- Create the identity_registry table
CREATE TABLE IF NOT EXISTS identity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  normalized_wallet TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_identity_registry_wallet_address ON identity_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);
CREATE INDEX IF NOT EXISTS idx_identity_registry_username ON identity_registry(username);

-- Create a trigger to update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_identity_registry_updated_at
BEFORE UPDATE ON identity_registry
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_wallet TEXT NOT NULL,
  followed_wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_wallet, followed_wallet)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower_wallet ON follows(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_follows_followed_wallet ON follows(followed_wallet);

-- Create the social_links table
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_links_wallet_address ON social_links(wallet_address);

-- Create a trigger to update the updated_at field
CREATE TRIGGER update_social_links_updated_at
BEFORE UPDATE ON social_links
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the vehicle_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS vehicle_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id INTEGER NOT NULL,
  owner_wallet TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_token_id ON vehicle_profiles(token_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_owner_wallet ON vehicle_profiles(owner_wallet);

-- Create a trigger to update the updated_at field
CREATE TRIGGER update_vehicle_profiles_updated_at
BEFORE UPDATE ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the vehicle_media table if it doesn't exist
CREATE TABLE IF NOT EXISTS vehicle_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle_id ON vehicle_media(vehicle_id);

-- Create a trigger to update the updated_at field
CREATE TRIGGER update_vehicle_media_updated_at
BEFORE UPDATE ON vehicle_media
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create the vehicle_videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS vehicle_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_videos_vehicle_id ON vehicle_videos(vehicle_id);

-- Create a trigger to update the updated_at field
CREATE TRIGGER update_vehicle_videos_updated_at
BEFORE UPDATE ON vehicle_videos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for the identity_registry table
ALTER TABLE identity_registry ENABLE ROW LEVEL SECURITY;

-- Allow users to read all identity_registry records
CREATE POLICY identity_registry_select_policy ON identity_registry
  FOR SELECT USING (true);

-- Allow users to update only their own identity_registry records
CREATE POLICY identity_registry_update_policy ON identity_registry
  FOR UPDATE USING (normalized_wallet = current_user);

-- Allow users to insert only their own identity_registry records
CREATE POLICY identity_registry_insert_policy ON identity_registry
  FOR INSERT WITH CHECK (normalized_wallet = current_user);

-- Create RLS policies for the follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Allow users to read all follows records
CREATE POLICY follows_select_policy ON follows
  FOR SELECT USING (true);

-- Allow users to insert only their own follows records
CREATE POLICY follows_insert_policy ON follows
  FOR INSERT WITH CHECK (follower_wallet = current_user);

-- Allow users to delete only their own follows records
CREATE POLICY follows_delete_policy ON follows
  FOR DELETE USING (follower_wallet = current_user);

-- Create RLS policies for the social_links table
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- Allow users to read all social_links records
CREATE POLICY social_links_select_policy ON social_links
  FOR SELECT USING (true);

-- Allow users to update only their own social_links records
CREATE POLICY social_links_update_policy ON social_links
  FOR UPDATE USING (wallet_address = current_user);

-- Allow users to insert only their own social_links records
CREATE POLICY social_links_insert_policy ON social_links
  FOR INSERT WITH CHECK (wallet_address = current_user);

-- Allow users to delete only their own social_links records
CREATE POLICY social_links_delete_policy ON social_links
  FOR DELETE USING (wallet_address = current_user);

-- Create RLS policies for the vehicle_profiles table
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all vehicle_profiles records
CREATE POLICY vehicle_profiles_select_policy ON vehicle_profiles
  FOR SELECT USING (true);

-- Allow users to update only their own vehicle_profiles records
CREATE POLICY vehicle_profiles_update_policy ON vehicle_profiles
  FOR UPDATE USING (owner_wallet = current_user);

-- Allow users to insert only their own vehicle_profiles records
CREATE POLICY vehicle_profiles_insert_policy ON vehicle_profiles
  FOR INSERT WITH CHECK (owner_wallet = current_user);

-- Create RLS policies for the vehicle_media table
ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;

-- Allow users to read all vehicle_media records
CREATE POLICY vehicle_media_select_policy ON vehicle_media
  FOR SELECT USING (true);

-- Allow users to update only their own vehicle_media records
CREATE POLICY vehicle_media_update_policy ON vehicle_media
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE vehicle_profiles.id = vehicle_media.vehicle_id
      AND vehicle_profiles.owner_wallet = current_user
    )
  );

-- Allow users to insert only their own vehicle_media records
CREATE POLICY vehicle_media_insert_policy ON vehicle_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE vehicle_profiles.id = vehicle_media.vehicle_id
      AND vehicle_profiles.owner_wallet = current_user
    )
  );

-- Allow users to delete only their own vehicle_media records
CREATE POLICY vehicle_media_delete_policy ON vehicle_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE vehicle_profiles.id = vehicle_media.vehicle_id
      AND vehicle_profiles.owner_wallet = current_user
    )
  );

-- Create RLS policies for the vehicle_videos table
ALTER TABLE vehicle_videos ENABLE ROW LEVEL SECURITY;

-- Allow users to read all vehicle_videos records
CREATE POLICY vehicle_videos_select_policy ON vehicle_videos
  FOR SELECT USING (true);

-- Allow users to update only their own vehicle_videos records
CREATE POLICY vehicle_videos_update_policy ON vehicle_videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE vehicle_profiles.id = vehicle_videos.vehicle_id
      AND vehicle_profiles.owner_wallet = current_user
    )
  );

-- Allow users to insert only their own vehicle_videos records
CREATE POLICY vehicle_videos_insert_policy ON vehicle_videos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE vehicle_profiles.id = vehicle_videos.vehicle_id
      AND vehicle_profiles.owner_wallet = current_user
    )
  );

-- Allow users to delete only their own vehicle_videos records
CREATE POLICY vehicle_videos_delete_policy ON vehicle_videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE vehicle_profiles.id = vehicle_videos.vehicle_id
      AND vehicle_profiles.owner_wallet = current_user
    )
  );

-- Create a function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;