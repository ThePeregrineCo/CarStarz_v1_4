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