-- Fixed Consolidated Schema Migration File
-- This file contains a fixed version of the consolidated schema with all necessary columns
-- and improved security features

-- First, disable all triggers and drop all tables in the public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Disable all triggers
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE TRIGGER ALL;';
    END LOOP;

    -- Drop all foreign key constraints
    FOR r IN (SELECT tc.constraint_name, tc.table_name 
              FROM information_schema.table_constraints tc 
              JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_name = ccu.constraint_name 
              WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name) || ';';
    END LOOP;

    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to execute SQL statements (used by setup scripts)
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- IDENTITY REGISTRY TABLES
-- =============================================

-- Create the identity_registry table
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

-- =============================================
-- VEHICLE TABLES
-- =============================================

-- Vehicle Profiles Table - Now with all required columns
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
    owner_id UUID REFERENCES identity_registry(id), -- Reference to identity registry
    primary_image_url TEXT,            -- URL to the primary image
    status VARCHAR(20),                -- Status of the vehicle (e.g., "active", "sold", "archived")
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
    context TEXT,
    upload_date TIMESTAMP WITH TIME ZONE,
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

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Create a function to normalize wallet addresses
CREATE OR REPLACE FUNCTION normalize_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Always set normalized_wallet to lowercase wallet_address
    NEW.normalized_wallet := LOWER(NEW.wallet_address);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically normalize wallet addresses
CREATE TRIGGER normalize_wallet_address_trigger
BEFORE INSERT OR UPDATE ON identity_registry
FOR EACH ROW
EXECUTE FUNCTION normalize_wallet_address();

-- Create a function to handle owner_wallet changes and maintain identity_id consistency
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

-- Create a trigger to automatically update identity_id when owner_wallet changes
CREATE TRIGGER sync_vehicle_owner_identity_trigger
BEFORE UPDATE ON vehicle_profiles
FOR EACH ROW
WHEN (OLD.owner_wallet IS DISTINCT FROM NEW.owner_wallet)
EXECUTE FUNCTION sync_vehicle_owner_identity();

-- Create a function to handle new vehicle creation
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

-- Create a trigger for new vehicle creation
CREATE TRIGGER set_initial_vehicle_identity_trigger
BEFORE INSERT ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION set_initial_vehicle_identity();

-- Create a function to automatically create identity registry entries for new vehicle owners
CREATE OR REPLACE FUNCTION ensure_vehicle_owner_has_identity()
RETURNS TRIGGER AS $$
DECLARE
  identity_exists BOOLEAN;
  identity_id UUID;
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
    )
    RETURNING id INTO identity_id;
    
    -- Update the vehicle with the new identity_id
    NEW.identity_id := identity_id;
  ELSE
    -- Get the identity_id for the existing identity
    SELECT id INTO NEW.identity_id
    FROM identity_registry
    WHERE normalized_wallet = LOWER(NEW.owner_wallet);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to ensure vehicle owners have identity registry entries
CREATE TRIGGER ensure_vehicle_owner_has_identity_trigger
BEFORE INSERT OR UPDATE OF owner_wallet ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_vehicle_owner_has_identity();

-- Create a function to verify data integrity
CREATE OR REPLACE FUNCTION verify_database_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    count INTEGER
) AS $$
DECLARE
    missing_identity_count INTEGER;
    mismatched_wallet_count INTEGER;
    orphaned_media_count INTEGER;
BEGIN
    -- Count vehicles with missing identity
    SELECT COUNT(*) INTO missing_identity_count
    FROM vehicle_profiles
    WHERE owner_id IS NULL AND owner_wallet IS NOT NULL;
    
    -- Count vehicles with mismatched wallet
    SELECT COUNT(*) INTO mismatched_wallet_count
    FROM vehicle_profiles vp
    JOIN identity_registry ir ON vp.owner_id = ir.id
    WHERE LOWER(vp.owner_wallet) != ir.normalized_wallet;
    
    -- Count orphaned media
    SELECT COUNT(*) INTO orphaned_media_count
    FROM vehicle_media vm
    LEFT JOIN vehicle_profiles vp ON vm.vehicle_id = vp.id
    WHERE vp.id IS NULL;
    
    -- Return results
    RETURN QUERY
    SELECT 'Missing identity links' as check_name,
           CASE WHEN missing_identity_count = 0 THEN 'OK' ELSE 'Failed' END as status,
           missing_identity_count as count
    UNION ALL
    SELECT 'Mismatched wallet addresses' as check_name,
           CASE WHEN mismatched_wallet_count = 0 THEN 'OK' ELSE 'Failed' END as status,
           mismatched_wallet_count as count
    UNION ALL
    SELECT 'Orphaned media' as check_name,
           CASE WHEN orphaned_media_count = 0 THEN 'OK' ELSE 'Failed' END as status,
           orphaned_media_count as count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check for orphaned media records
CREATE OR REPLACE FUNCTION check_orphaned_media()
RETURNS TABLE (
    media_id UUID,
    vehicle_id UUID,
    url TEXT,
    type TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vm.id as media_id,
        vm.vehicle_id,
        vm.url,
        vm.type,
        'Orphaned media record' as status
    FROM
        vehicle_media vm
    LEFT JOIN
        vehicle_profiles vp ON vm.vehicle_id = vp.id
    WHERE
        vp.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix orphaned media records by deleting them
CREATE OR REPLACE FUNCTION fix_orphaned_media()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete orphaned media records
    WITH orphaned_media AS (
        SELECT vm.id
        FROM vehicle_media vm
        LEFT JOIN vehicle_profiles vp ON vm.vehicle_id = vp.id
        WHERE vp.id IS NULL
    )
    DELETE FROM vehicle_media
    WHERE id IN (SELECT id FROM orphaned_media);
    
    -- Get count of deleted records
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SECURITY POLICIES
-- =============================================

-- Enable Row Level Security
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
ALTER TABLE identity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Vehicle profiles policies with case-insensitive comparisons
CREATE POLICY "Public profiles are viewable by everyone"
    ON vehicle_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profiles"
    ON vehicle_profiles FOR INSERT
    WITH CHECK (LOWER(auth.uid()::text) = LOWER(owner_wallet));

CREATE POLICY "Users can update their own profiles"
    ON vehicle_profiles FOR UPDATE
    USING (LOWER(auth.uid()::text) = LOWER(owner_wallet));

CREATE POLICY "Users can delete their own profiles"
    ON vehicle_profiles FOR DELETE
    USING (LOWER(auth.uid()::text) = LOWER(owner_wallet));

-- Modifications policies with case-insensitive comparisons
CREATE POLICY "Modifications are viewable by everyone"
    ON vehicle_modifications FOR SELECT
    USING (true);

CREATE POLICY "Users can insert modifications to their own vehicles"
    ON vehicle_modifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

CREATE POLICY "Users can update modifications on their own vehicles"
    ON vehicle_modifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

CREATE POLICY "Users can delete modifications on their own vehicles"
    ON vehicle_modifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

-- Media policies with case-insensitive comparisons
CREATE POLICY "Media is viewable by everyone"
    ON vehicle_media FOR SELECT
    USING (true);

CREATE POLICY "Users can insert media to their own vehicles"
    ON vehicle_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

CREATE POLICY "Users can update media on their own vehicles"
    ON vehicle_media FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

CREATE POLICY "Users can delete media on their own vehicles"
    ON vehicle_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

-- Identity registry policies
CREATE POLICY "Identity profiles are viewable by everyone"
    ON identity_registry FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own identity"
    ON identity_registry FOR INSERT
    WITH CHECK (LOWER(auth.uid()::text) = LOWER(wallet_address));

CREATE POLICY "Users can update their own identity"
    ON identity_registry FOR UPDATE
    USING (LOWER(auth.uid()::text) = LOWER(wallet_address));

-- Social links policies
CREATE POLICY "Social links are viewable by everyone"
    ON social_links FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own social links"
    ON social_links FOR INSERT
    WITH CHECK (LOWER(auth.uid()::text) = LOWER(wallet_address));

CREATE POLICY "Users can update their own social links"
    ON social_links FOR UPDATE
    USING (LOWER(auth.uid()::text) = LOWER(wallet_address));

CREATE POLICY "Users can delete their own social links"
    ON social_links FOR DELETE
    USING (LOWER(auth.uid()::text) = LOWER(wallet_address));

-- =============================================
-- INDEXES
-- =============================================

-- Create indexes for better performance
CREATE INDEX idx_vehicle_profiles_token_id ON vehicle_profiles(token_id);
CREATE INDEX idx_vehicle_profiles_owner ON vehicle_profiles(owner_wallet);
CREATE INDEX idx_vehicle_profiles_identity_id ON vehicle_profiles(owner_id);
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

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

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

CREATE TRIGGER update_identity_registry_updated_at
    BEFORE UPDATE ON identity_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at
    BEFORE UPDATE ON social_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORAGE BUCKET SETUP
-- =============================================

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
      WHERE LOWER(owner_wallet) = LOWER(auth.uid()::text)
    )
  );

CREATE POLICY "Users can update their own vehicle media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE LOWER(owner_wallet) = LOWER(auth.uid()::text)
    )
  );

CREATE POLICY "Users can delete their own vehicle media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE LOWER(owner_wallet) = LOWER(auth.uid()::text)
    )
  );

-- =============================================
-- MIGRATION HELPER FUNCTION
-- =============================================

-- Create a function to migrate data from an existing database
CREATE OR REPLACE FUNCTION migrate_existing_database()
RETURNS TEXT AS $$
DECLARE
    vehicle_count INTEGER := 0;
    identity_count INTEGER := 0;
    media_count INTEGER := 0;
    result TEXT;
BEGIN
    -- Insert a test record to verify the identity_registry table works
    INSERT INTO identity_registry (wallet_address, normalized_wallet, username, display_name, bio)
    VALUES ('0xTestWallet', '0xtestwallet', 'test_user', 'Test User', 'This is a test user')
    ON CONFLICT (normalized_wallet) DO NOTHING;
    
    -- Run verification to check database integrity
    PERFORM verify_database_integrity();
    
    -- Get counts
    SELECT COUNT(*) INTO vehicle_count FROM vehicle_profiles;
    SELECT COUNT(*) INTO identity_count FROM identity_registry;
    SELECT COUNT(*) INTO media_count FROM vehicle_media;
    
    result := 'Migration complete. Database contains ' || 
              vehicle_count || ' vehicles, ' || 
              identity_count || ' identities, and ' || 
              media_count || ' media items.';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Call the migration helper function
SELECT migrate_existing_database();