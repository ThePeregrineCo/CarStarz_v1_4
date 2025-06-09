-- Clean Schema Migration Script for CarStarz Application
-- This script will drop all existing tables and recreate them with the correct schema

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
-- VEHICLE TABLES
-- =============================================

-- Vehicle Profiles Table
CREATE TABLE IF NOT EXISTS vehicle_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL UNIQUE,  -- References the NFT token ID
    vin VARCHAR(17) NOT NULL UNIQUE,   -- Vehicle Identification Number
    make VARCHAR(50) NOT NULL,         -- Vehicle make
    model VARCHAR(50) NOT NULL,        -- Vehicle model
    year INTEGER NOT NULL,             -- Vehicle year
    name VARCHAR(100),                 -- Custom vehicle name (e.g., "Redzilla")
    description TEXT,                  -- Long description
    owner_wallet VARCHAR(42) NOT NULL, -- Ethereum wallet address
    owner_id UUID,                     -- Reference to user ID (can be null for backward compatibility)
    primary_image_url TEXT,            -- URL to the primary image
    status VARCHAR(20),                -- Status of the vehicle (e.g., "active", "sold", "archived")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Modifications Table
CREATE TABLE IF NOT EXISTS vehicle_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_modifications
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Vehicle Media Table
CREATE TABLE IF NOT EXISTS vehicle_media (
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
CREATE TABLE IF NOT EXISTS vehicle_links (
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
CREATE TABLE IF NOT EXISTS vehicle_specifications (
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
CREATE TABLE IF NOT EXISTS vehicle_comments (
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

-- Vehicle Videos Table
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

-- Audit Log Table
CREATE TABLE IF NOT EXISTS vehicle_audit_log (
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

-- User Collections Table (starred vehicles)
CREATE TABLE IF NOT EXISTS user_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_wallet TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_wallet, token_id)
);

-- User Follows Table
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_wallet TEXT NOT NULL,
    followed_wallet TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_wallet, followed_wallet)
);

-- =============================================
-- IDENTITY REGISTRY TABLES
-- =============================================

-- Identity Registry Table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Follows Table
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_wallet TEXT NOT NULL,
    followed_wallet TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_wallet, followed_wallet)
);

-- Social Links Table
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER AND BUSINESS TABLES
-- =============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    profile_image_url TEXT,
    banner_image_url TEXT,
    email TEXT,
    user_type TEXT DEFAULT 'owner',
    subscription_tier TEXT DEFAULT 'free',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_image_url TEXT,
    contact_info JSONB DEFAULT '{}',
    specialties TEXT[],
    subscription_tier TEXT DEFAULT 'standard',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    website_url TEXT,
    google_maps_url TEXT,
    location TEXT,
    business_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Builders Table (alias for businesses)
CREATE TABLE IF NOT EXISTS builders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    contact_info JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'standard',
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parts Table
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    description TEXT,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Parts Table
CREATE TABLE IF NOT EXISTS vehicle_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicle_profiles(id) NOT NULL,
    part_id UUID REFERENCES parts(id) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Builder Vehicles Table
CREATE TABLE IF NOT EXISTS builder_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    builder_id UUID REFERENCES builders(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicle_profiles(id) NOT NULL,
    build_date TIMESTAMP WITH TIME ZONE,
    build_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Builder Follows Table
CREATE TABLE IF NOT EXISTS builder_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    builder_id UUID REFERENCES builders(id) NOT NULL,
    follow_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clubs Table
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id) NOT NULL,
    club_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_image_url TEXT,
    is_private BOOLEAN DEFAULT false,
    club_rules TEXT,
    membership_requirements TEXT,
    location TEXT,
    founding_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Club Memberships Table
CREATE TABLE IF NOT EXISTS club_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    membership_status TEXT DEFAULT 'pending',
    membership_level TEXT DEFAULT 'member',
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, user_id)
);

-- Club Vehicles Table
CREATE TABLE IF NOT EXISTS club_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) NOT NULL,
    token_id INTEGER NOT NULL,
    added_by UUID REFERENCES users(id),
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, token_id)
);

-- Club Events Table
CREATE TABLE IF NOT EXISTS club_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price_range JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Vehicle Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_token_id ON vehicle_profiles(token_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_owner_wallet ON vehicle_profiles(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_owner_id ON vehicle_profiles(owner_id);

-- Vehicle Modifications Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_modifications_vehicle_id ON vehicle_modifications(vehicle_id);

-- Vehicle Media Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle_id ON vehicle_media(vehicle_id);

-- Vehicle Links Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_links_vehicle_id ON vehicle_links(vehicle_id);

-- Vehicle Specifications Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_specifications_vehicle_id ON vehicle_specifications(vehicle_id);

-- Vehicle Comments Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_comments_vehicle_id ON vehicle_comments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_comments_user_wallet ON vehicle_comments(user_wallet);

-- Vehicle Videos Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_videos_vehicle_id ON vehicle_videos(vehicle_id);

-- Vehicle Audit Log Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_audit_log_vehicle_id ON vehicle_audit_log(vehicle_id);

-- User Collections Indexes
CREATE INDEX IF NOT EXISTS idx_user_collections_user_wallet ON user_collections(user_wallet);
CREATE INDEX IF NOT EXISTS idx_user_collections_token_id ON user_collections(token_id);

-- User Follows Indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_wallet ON user_follows(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed_wallet ON user_follows(followed_wallet);

-- Identity Registry Indexes
CREATE INDEX IF NOT EXISTS idx_identity_registry_wallet_address ON identity_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);
CREATE INDEX IF NOT EXISTS idx_identity_registry_username ON identity_registry(username);

-- Follows Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_wallet ON follows(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_follows_followed_wallet ON follows(followed_wallet);

-- Social Links Indexes
CREATE INDEX IF NOT EXISTS idx_social_links_wallet_address ON social_links(wallet_address);

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Businesses Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);

-- Builders Indexes
CREATE INDEX IF NOT EXISTS idx_builders_user_id ON builders(user_id);

-- Parts Indexes
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);

-- Vehicle Parts Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_vehicle_id ON vehicle_parts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_part_id ON vehicle_parts(part_id);

-- Builder Vehicles Indexes
CREATE INDEX IF NOT EXISTS idx_builder_vehicles_builder_id ON builder_vehicles(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_vehicles_vehicle_id ON builder_vehicles(vehicle_id);

-- Builder Follows Indexes
CREATE INDEX IF NOT EXISTS idx_builder_follows_user_id ON builder_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_follows_builder_id ON builder_follows(builder_id);

-- Clubs Indexes
CREATE INDEX IF NOT EXISTS idx_clubs_creator_id ON clubs(creator_id);

-- Club Memberships Indexes
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);

-- Club Vehicles Indexes
CREATE INDEX IF NOT EXISTS idx_club_vehicles_club_id ON club_vehicles(club_id);
CREATE INDEX IF NOT EXISTS idx_club_vehicles_token_id ON club_vehicles(token_id);

-- Club Events Indexes
CREATE INDEX IF NOT EXISTS idx_club_events_club_id ON club_events(club_id);

-- Services Indexes
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);

-- =============================================
-- CREATE TRIGGERS
-- =============================================

-- Vehicle Profiles Trigger
CREATE TRIGGER update_vehicle_profiles_updated_at
    BEFORE UPDATE ON vehicle_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Modifications Trigger
CREATE TRIGGER update_vehicle_modifications_updated_at
    BEFORE UPDATE ON vehicle_modifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Media Trigger
CREATE TRIGGER update_vehicle_media_updated_at
    BEFORE UPDATE ON vehicle_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Links Trigger
CREATE TRIGGER update_vehicle_links_updated_at
    BEFORE UPDATE ON vehicle_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Specifications Trigger
CREATE TRIGGER update_vehicle_specifications_updated_at
    BEFORE UPDATE ON vehicle_specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Comments Trigger
CREATE TRIGGER update_vehicle_comments_updated_at
    BEFORE UPDATE ON vehicle_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Videos Trigger
CREATE TRIGGER update_vehicle_videos_updated_at
    BEFORE UPDATE ON vehicle_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Audit Log Trigger
CREATE TRIGGER update_vehicle_audit_log_updated_at
    BEFORE UPDATE ON vehicle_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Collections Trigger
CREATE TRIGGER update_user_collections_updated_at
    BEFORE UPDATE ON user_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Follows Trigger
CREATE TRIGGER update_user_follows_updated_at
    BEFORE UPDATE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Identity Registry Trigger
CREATE TRIGGER update_identity_registry_updated_at
    BEFORE UPDATE ON identity_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Social Links Trigger
CREATE TRIGGER update_social_links_updated_at
    BEFORE UPDATE ON social_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Users Trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Businesses Trigger
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Builders Trigger
CREATE TRIGGER update_builders_updated_at
    BEFORE UPDATE ON builders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Parts Trigger
CREATE TRIGGER update_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Parts Trigger
CREATE TRIGGER update_vehicle_parts_updated_at
    BEFORE UPDATE ON vehicle_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Builder Vehicles Trigger
CREATE TRIGGER update_builder_vehicles_updated_at
    BEFORE UPDATE ON builder_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Builder Follows Trigger
CREATE TRIGGER update_builder_follows_updated_at
    BEFORE UPDATE ON builder_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clubs Trigger
CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Club Memberships Trigger
CREATE TRIGGER update_club_memberships_updated_at
    BEFORE UPDATE ON club_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Club Vehicles Trigger
CREATE TRIGGER update_club_vehicles_updated_at
    BEFORE UPDATE ON club_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Club Events Trigger
CREATE TRIGGER update_club_events_updated_at
    BEFORE UPDATE ON club_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Services Trigger
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREATE STORAGE BUCKET
-- =============================================

-- Create storage bucket for vehicle media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-media', 'vehicle-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for vehicle media
DROP POLICY IF EXISTS "Vehicle media is publicly accessible" ON storage.objects;
CREATE POLICY "Vehicle media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-media');

DROP POLICY IF EXISTS "Users can upload media for their own vehicles" ON storage.objects;
CREATE POLICY "Users can upload media for their own vehicles"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE owner_wallet = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can update their own vehicle media" ON storage.objects;
CREATE POLICY "Users can update their own vehicle media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE owner_wallet = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete their own vehicle media" ON storage.objects;
CREATE POLICY "Users can delete their own vehicle media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-media' AND
    EXISTS (
      SELECT 1 FROM vehicle_profiles
      WHERE owner_wallet = auth.uid()::text
    )
  );

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE builders ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Vehicle profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON vehicle_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON vehicle_profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profiles" ON vehicle_profiles;
CREATE POLICY "Users can insert their own profiles"
    ON vehicle_profiles FOR INSERT
    WITH CHECK (auth.uid()::text = owner_wallet);

DROP POLICY IF EXISTS "Users can update their own profiles" ON vehicle_profiles;
CREATE POLICY "Users can update their own profiles"
    ON vehicle_profiles FOR UPDATE
    USING (auth.uid()::text = owner_wallet);

DROP POLICY IF EXISTS "Users can delete their own profiles" ON vehicle_profiles;
CREATE POLICY "Users can delete their own profiles"
    ON vehicle_profiles FOR DELETE
    USING (auth.uid()::text = owner_wallet);

-- Vehicle modifications policies
DROP POLICY IF EXISTS "Modifications are viewable by everyone" ON vehicle_modifications;
CREATE POLICY "Modifications are viewable by everyone"
    ON vehicle_modifications FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert modifications to their own vehicles" ON vehicle_modifications;
CREATE POLICY "Users can insert modifications to their own vehicles"
    ON vehicle_modifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can update modifications on their own vehicles" ON vehicle_modifications;
CREATE POLICY "Users can update modifications on their own vehicles"
    ON vehicle_modifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can delete modifications on their own vehicles" ON vehicle_modifications;
CREATE POLICY "Users can delete modifications on their own vehicles"
    ON vehicle_modifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Vehicle media policies
DROP POLICY IF EXISTS "Media is viewable by everyone" ON vehicle_media;
CREATE POLICY "Media is viewable by everyone"
    ON vehicle_media FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert media to their own vehicles" ON vehicle_media;
CREATE POLICY "Users can insert media to their own vehicles"
    ON vehicle_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can update media on their own vehicles" ON vehicle_media;
CREATE POLICY "Users can update media on their own vehicles"
    ON vehicle_media FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can delete media on their own vehicles" ON vehicle_media;
CREATE POLICY "Users can delete media on their own vehicles"
    ON vehicle_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Vehicle links policies
DROP POLICY IF EXISTS "Links are viewable by everyone" ON vehicle_links;
CREATE POLICY "Links are viewable by everyone"
    ON vehicle_links FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert links to their own vehicles" ON vehicle_links;
CREATE POLICY "Users can insert links to their own vehicles"
    ON vehicle_links FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can update links on their own vehicles" ON vehicle_links;
CREATE POLICY "Users can update links on their own vehicles"
    ON vehicle_links FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can delete links on their own vehicles" ON vehicle_links;
CREATE POLICY "Users can delete links on their own vehicles"
    ON vehicle_links FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );