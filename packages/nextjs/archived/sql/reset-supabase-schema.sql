-- Reset Supabase Schema Script for CarStarz
-- This script will drop all existing tables and recreate the schema from scratch

-- First, drop all existing tables in the public schema
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

-- Now apply the base schema from schema.sql

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_media
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

-- Create RLS policies
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_audit_log ENABLE ROW LEVEL SECURITY;

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

-- Audit log policies
CREATE POLICY "Audit logs are viewable by everyone"
    ON vehicle_audit_log FOR SELECT
    USING (true);

CREATE POLICY "Users can insert audit logs for their own vehicles"
    ON vehicle_audit_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Indexes for better query performance
CREATE INDEX idx_vehicle_profiles_token_id ON vehicle_profiles(token_id);
CREATE INDEX idx_vehicle_profiles_owner ON vehicle_profiles(owner_wallet);
CREATE INDEX idx_vehicle_modifications_vehicle ON vehicle_modifications(vehicle_id);
CREATE INDEX idx_vehicle_media_vehicle ON vehicle_media(vehicle_id);
CREATE INDEX idx_vehicle_audit_log_vehicle ON vehicle_audit_log(vehicle_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to relevant tables
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

-- Create storage bucket for vehicle media
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

-- Now apply the schema updates from schema-updates.sql

-- For external links
CREATE TABLE vehicle_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For specifications
CREATE TABLE vehicle_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For comments
CREATE TABLE vehicle_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  user_wallet TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update vehicle_media table to add categories and featured flag
ALTER TABLE vehicle_media 
ADD COLUMN category TEXT,
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN metadata JSONB;

-- Add RLS policies for the new tables
ALTER TABLE vehicle_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can update their own comments"
    ON vehicle_comments FOR UPDATE
    USING (auth.uid()::text = user_wallet);

CREATE POLICY "Users can delete their own comments"
    ON vehicle_comments FOR DELETE
    USING (auth.uid()::text = user_wallet);

-- Create triggers for updated_at on new tables
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

-- Create indexes for the new tables
CREATE INDEX idx_vehicle_links_vehicle ON vehicle_links(vehicle_id);
CREATE INDEX idx_vehicle_specifications_vehicle ON vehicle_specifications(vehicle_id);
CREATE INDEX idx_vehicle_comments_vehicle ON vehicle_comments(vehicle_id);