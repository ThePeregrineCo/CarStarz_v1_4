-- Consolidated Migration File
-- Generated on Fri May 30 17:12:18 EDT 2025
-- This file contains all database schema migrations

-- Including reset-schema-carstarz.sql

-- Reset script for CARSTARZ application
-- This script will drop existing tables and recreate them with the new schema

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS vehicle_comments CASCADE;
DROP TABLE IF EXISTS vehicle_specifications CASCADE;
DROP TABLE IF EXISTS vehicle_links CASCADE;
DROP TABLE IF EXISTS vehicle_audit_log CASCADE;
DROP TABLE IF EXISTS vehicle_media CASCADE;
DROP TABLE IF EXISTS vehicle_modifications CASCADE;
DROP TABLE IF EXISTS vehicle_profiles CASCADE;

-- Now create the tables from scratch

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vehicle Profiles Table
CREATE TABLE vehicle_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL UNIQUE,  -- References the NFT token ID
    vin VARCHAR(17) NOT NULL UNIQUE,   -- Vehicle Identification Number
    make VARCHAR(50) NOT NULL,         -- Vehicle make
    model VARCHAR(50) NOT NULL,        -- Vehicle model
    year INTEGER NOT NULL,             -- Vehicle year
    name VARCHAR(100),                 -- Custom vehicle name (e.g., "Redzilla")
    description TEXT,                  -- Long description
    owner_wallet VARCHAR(42) NOT NULL, -- Ethereum wallet address
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Modifications Table
CREATE TABLE vehicle_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    image_url TEXT,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_modifications
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Vehicle Media Table
CREATE TABLE vehicle_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
    caption TEXT,
    category TEXT,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_media
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Vehicle Links Table
CREATE TABLE vehicle_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_links
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Vehicle Specifications Table
CREATE TABLE vehicle_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_specifications
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Vehicle Comments Table
CREATE TABLE vehicle_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    user_wallet TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_comments
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Audit Log Table
CREATE TABLE vehicle_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,       -- e.g., "CREATE", "UPDATE", "DELETE"
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_audit_log
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- NEW TABLES FOR CARSTARZ FEATURES

-- For YouTube videos
CREATE TABLE vehicle_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_videos
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- For user collections (starred vehicles)
CREATE TABLE user_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_wallet TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_wallet, token_id)
);

-- For user follows
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_wallet TEXT NOT NULL,
    followed_wallet TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_wallet, followed_wallet)
);

-- Create RLS policies
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Vehicle profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON vehicle_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profiles"
    ON vehicle_profiles FOR INSERT
    WITH CHECK (auth.uid()::text = owner_wallet);

CREATE POLICY "Users can update their own profiles"
    ON vehicle_profiles FOR UPDATE
    USING (auth.uid()::text = owner_wallet);

CREATE POLICY "Users can delete their own profiles"
    ON vehicle_profiles FOR DELETE
    USING (auth.uid()::text = owner_wallet);

-- Modifications policies
CREATE POLICY "Modifications are viewable by everyone"
    ON vehicle_modifications FOR SELECT
    USING (true);

CREATE POLICY "Users can insert modifications to their own vehicles"
    ON vehicle_modifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can update modifications on their own vehicles"
    ON vehicle_modifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete modifications on their own vehicles"
    ON vehicle_modifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Media policies
CREATE POLICY "Media is viewable by everyone"
    ON vehicle_media FOR SELECT
    USING (true);

CREATE POLICY "Users can insert media to their own vehicles"
    ON vehicle_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can update media on their own vehicles"
    ON vehicle_media FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete media on their own vehicles"
    ON vehicle_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Links policies
CREATE POLICY "Links are viewable by everyone"
    ON vehicle_links FOR SELECT
    USING (true);

CREATE POLICY "Users can insert links to their own vehicles"
    ON vehicle_links FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can update links on their own vehicles"
    ON vehicle_links FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete links on their own vehicles"
    ON vehicle_links FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Specifications policies
CREATE POLICY "Specifications are viewable by everyone"
    ON vehicle_specifications FOR SELECT
    USING (true);

CREATE POLICY "Users can insert specifications to their own vehicles"
    ON vehicle_specifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can update specifications on their own vehicles"
    ON vehicle_specifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete specifications on their own vehicles"
    ON vehicle_specifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
    ON vehicle_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own comments"
    ON vehicle_comments FOR INSERT
    WITH CHECK (auth.uid()::text = user_wallet);

CREATE POLICY "Users can delete their own comments"
    ON vehicle_comments FOR DELETE
    USING (auth.uid()::text = user_wallet);

-- Videos policies
CREATE POLICY "Videos are viewable by everyone"
    ON vehicle_videos FOR SELECT
    USING (true);

CREATE POLICY "Users can insert videos to their own vehicles"
    ON vehicle_videos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can update videos on their own vehicles"
    ON vehicle_videos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete videos on their own vehicles"
    ON vehicle_videos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- User collections policies
CREATE POLICY "Collections are viewable by everyone"
    ON user_collections FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own collections"
    ON user_collections FOR INSERT
    WITH CHECK (auth.uid()::text = user_wallet);

CREATE POLICY "Users can delete their own collections"
    ON user_collections FOR DELETE
    USING (auth.uid()::text = user_wallet);

-- User follows policies
CREATE POLICY "Follows are viewable by everyone"
    ON user_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own follows"
    ON user_follows FOR INSERT
    WITH CHECK (auth.uid()::text = follower_wallet);

CREATE POLICY "Users can delete their own follows"
    ON user_follows FOR DELETE
    USING (auth.uid()::text = follower_wallet);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables
CREATE TRIGGER update_vehicle_profiles_updated_at
    BEFORE UPDATE ON vehicle_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_modifications_updated_at
    BEFORE UPDATE ON vehicle_modifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_media_updated_at
    BEFORE UPDATE ON vehicle_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_links_updated_at
    BEFORE UPDATE ON vehicle_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_specifications_updated_at
    BEFORE UPDATE ON vehicle_specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_comments_updated_at
    BEFORE UPDATE ON vehicle_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_videos_updated_at
    BEFORE UPDATE ON vehicle_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collections_updated_at
    BEFORE UPDATE ON user_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_follows_updated_at
    BEFORE UPDATE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for vehicle media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-media', 'vehicle-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for vehicle media
CREATE POLICY "Vehicle media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-media');

CREATE POLICY "Users can upload media for their own vehicles"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE owner_wallet = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own vehicle media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE owner_wallet = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own vehicle media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE owner_wallet = auth.uid()::text
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_vehicle_profiles_token_id ON vehicle_profiles(token_id);
CREATE INDEX idx_vehicle_profiles_owner ON vehicle_profiles(owner_wallet);
CREATE INDEX idx_vehicle_modifications_vehicle ON vehicle_modifications(vehicle_id);
CREATE INDEX idx_vehicle_media_vehicle ON vehicle_media(vehicle_id);
CREATE INDEX idx_vehicle_links_vehicle ON vehicle_links(vehicle_id);
CREATE INDEX idx_vehicle_specifications_vehicle ON vehicle_specifications(vehicle_id);
CREATE INDEX idx_vehicle_comments_vehicle ON vehicle_comments(vehicle_id);
CREATE INDEX idx_vehicle_videos_vehicle ON vehicle_videos(vehicle_id);
CREATE INDEX idx_user_collections_user ON user_collections(user_wallet);
CREATE INDEX idx_user_collections_token ON user_collections(token_id);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_wallet);
CREATE INDEX idx_user_follows_followed ON user_follows(followed_wallet);

-- Including identity-registry-schema.sql

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

-- Including vehicle-identity-integration.sql

-- Vehicle Identity Integration SQL
-- This script adds identity_id to vehicle_profiles and sets up triggers to handle ownership transfers
-- Purpose: Enable linking vehicle profiles to the identity registry system while maintaining
-- data integrity during NFT ownership transfers on the blockchain

-- Transaction wrapper to ensure all operations succeed or fail together
BEGIN;

-- First, check for and fix any duplicate wallet addresses in identity_registry
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check if normalized_wallet has a UNIQUE constraint
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'identity_registry_normalized_wallet_key'
        AND table_name = 'identity_registry'
    ) THEN
        -- Count duplicates
        SELECT COUNT(*) INTO duplicate_count
        FROM (
            SELECT normalized_wallet
            FROM identity_registry
            GROUP BY normalized_wallet
            HAVING COUNT(*) > 1
        ) as duplicates;
        
        IF duplicate_count > 0 THEN
            RAISE NOTICE 'Found % wallet addresses with duplicate entries in identity_registry', duplicate_count;
            RAISE NOTICE 'Please run the fix-duplicate-identities.sql script before proceeding';
            RAISE EXCEPTION 'Duplicate wallet addresses found in identity_registry';
        END IF;
        
        -- Add UNIQUE constraint to prevent future duplicates
        ALTER TABLE identity_registry ADD CONSTRAINT identity_registry_normalized_wallet_key UNIQUE (normalized_wallet);
        RAISE NOTICE 'Added UNIQUE constraint on normalized_wallet column';
    END IF;
END $$;

-- Step 1: Add identity_id column to vehicle_profiles
-- This creates a relationship between vehicles and their owners' identities
ALTER TABLE vehicle_profiles
ADD COLUMN IF NOT EXISTS identity_id UUID REFERENCES identity_registry(id);

-- Step 2: Create index for faster lookups by identity_id
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_identity_id ON vehicle_profiles(identity_id);

-- Step 3: Update existing records to set identity_id based on owner_wallet
-- This ensures all existing vehicles are properly linked to their owners' identities
UPDATE vehicle_profiles
SET identity_id = ir.id
FROM identity_registry ir
WHERE LOWER(vehicle_profiles.owner_wallet) = ir.normalized_wallet;

-- Log records that couldn't be linked (for monitoring purposes)
DO $$
DECLARE
    unlinked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unlinked_count
    FROM vehicle_profiles
    WHERE identity_id IS NULL AND owner_wallet IS NOT NULL;
    
    IF unlinked_count > 0 THEN
        RAISE NOTICE 'Warning: % vehicle profiles have owner_wallet but no matching identity_id', unlinked_count;
    END IF;
END $$;

-- Step 4: Create a function to handle owner_wallet changes and maintain identity_id consistency
CREATE OR REPLACE FUNCTION sync_vehicle_owner_identity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if owner_wallet has changed
  IF OLD.owner_wallet IS DISTINCT FROM NEW.owner_wallet THEN
    -- Try to find the identity_id for the new owner
    SELECT id INTO NEW.identity_id
    FROM identity_registry
    WHERE normalized_wallet = LOWER(NEW.owner_wallet);
    
    -- If no identity found, identity_id will be NULL
    -- This allows transfers to wallets without identity registry entries
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a trigger to automatically update identity_id when owner_wallet changes
DROP TRIGGER IF EXISTS sync_vehicle_owner_identity_trigger ON vehicle_profiles;
CREATE TRIGGER sync_vehicle_owner_identity_trigger
BEFORE UPDATE ON vehicle_profiles
FOR EACH ROW
WHEN (OLD.owner_wallet IS DISTINCT FROM NEW.owner_wallet)
EXECUTE FUNCTION sync_vehicle_owner_identity();

-- Step 6: Create a function to handle new vehicle creation
CREATE OR REPLACE FUNCTION set_initial_vehicle_identity()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find the identity_id for the owner
  SELECT id INTO NEW.identity_id
  FROM identity_registry
  WHERE normalized_wallet = LOWER(NEW.owner_wallet);
  
  -- If no identity found, identity_id will be NULL
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create a trigger for new vehicle creation
DROP TRIGGER IF EXISTS set_initial_vehicle_identity_trigger ON vehicle_profiles;
CREATE TRIGGER set_initial_vehicle_identity_trigger
BEFORE INSERT ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION set_initial_vehicle_identity();

-- Step 8: Create a view that joins vehicle_profiles with identity_registry
CREATE OR REPLACE VIEW vehicle_profiles_with_owner AS
SELECT 
  vp.*,
  ir.id as owner_id,
  ir.wallet_address as owner_wallet_address,
  ir.normalized_wallet as owner_normalized_wallet,
  ir.username as owner_username,
  ir.display_name as owner_display_name,
  ir.profile_image_url as owner_profile_image
FROM 
  vehicle_profiles vp
LEFT JOIN 
  identity_registry ir ON vp.identity_id = ir.id;

-- Step 9: Create a function to automatically create identity registry entries for new vehicle owners
CREATE OR REPLACE FUNCTION ensure_vehicle_owner_has_identity()
RETURNS TRIGGER AS $$
DECLARE
  identity_exists BOOLEAN;
BEGIN
  -- Check if the owner already has an identity
  SELECT EXISTS(
    SELECT 1 FROM identity_registry 
    WHERE normalized_wallet = LOWER(NEW.owner_wallet)
  ) INTO identity_exists;
  
  -- If not, create a basic identity entry
  IF NOT identity_exists THEN
    INSERT INTO identity_registry (
      wallet_address,
      normalized_wallet,
      username,
      display_name
    ) VALUES (
      NEW.owner_wallet,
      LOWER(NEW.owner_wallet),
      'user_' || SUBSTRING(LOWER(NEW.owner_wallet), 3, 6),
      SUBSTRING(NEW.owner_wallet, 1, 6) || '...' || SUBSTRING(NEW.owner_wallet, LENGTH(NEW.owner_wallet) - 3)
    );
    
    -- Update the vehicle with the new identity_id
    NEW.identity_id := (
      SELECT id FROM identity_registry 
      WHERE normalized_wallet = LOWER(NEW.owner_wallet)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create a trigger to ensure vehicle owners have identity registry entries
DROP TRIGGER IF EXISTS ensure_vehicle_owner_has_identity_trigger ON vehicle_profiles;
CREATE TRIGGER ensure_vehicle_owner_has_identity_trigger
BEFORE INSERT OR UPDATE OF owner_wallet ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_vehicle_owner_has_identity();

-- Step 11: Create a function to handle blockchain transfer events
-- This is a placeholder for an API endpoint that will be called when NFT transfers are detected
-- The actual implementation will be in the application code
COMMENT ON TABLE vehicle_profiles IS 'Stores vehicle profile data with identity_id linking to owner identity';
COMMENT ON COLUMN vehicle_profiles.identity_id IS 'References identity_registry.id - automatically updated when owner_wallet changes';
COMMENT ON COLUMN vehicle_profiles.owner_wallet IS 'Blockchain wallet address of the current vehicle owner - source of truth for ownership';

-- Step 12: Create a function to verify data integrity
CREATE OR REPLACE FUNCTION verify_vehicle_identity_integrity()
RETURNS TABLE (
    token_id INTEGER,
    owner_wallet TEXT,
    identity_id UUID,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vp.token_id,
        vp.owner_wallet,
        vp.identity_id,
        CASE
            WHEN vp.identity_id IS NULL AND vp.owner_wallet IS NOT NULL THEN 'Missing identity'
            WHEN ir.normalized_wallet != LOWER(vp.owner_wallet) THEN 'Mismatched identity'
            ELSE 'OK'
        END as status
    FROM
        vehicle_profiles vp
    LEFT JOIN
        identity_registry ir ON vp.identity_id = ir.id
    WHERE
        vp.identity_id IS NULL OR ir.normalized_wallet != LOWER(vp.owner_wallet);
END;
$$ LANGUAGE plpgsql;

-- Commit all changes if everything succeeded
COMMIT;

-- Including add-vehicle-videos-table.sql

-- Add vehicle_videos table for YouTube videos
CREATE TABLE IF NOT EXISTS vehicle_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_videos
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Create index for faster video lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_videos_vehicle_id ON vehicle_videos(vehicle_id);

-- Enable row level security
ALTER TABLE vehicle_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_videos
CREATE POLICY "Videos are viewable by everyone"
    ON vehicle_videos FOR SELECT
    USING (true);

CREATE POLICY "Users can insert videos to their own vehicles"
    ON vehicle_videos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can update videos on their own vehicles"
    ON vehicle_videos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete videos on their own vehicles"
    ON vehicle_videos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_vehicle_videos_updated_at
    BEFORE UPDATE ON vehicle_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

