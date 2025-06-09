-- Create tables for CarStarz application
-- This script creates the necessary tables without dropping existing ones

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vehicle Profiles Table
CREATE TABLE IF NOT EXISTS vehicle_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL UNIQUE,
    vin VARCHAR(17) NOT NULL UNIQUE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    name VARCHAR(100),
    description TEXT,
    owner_wallet VARCHAR(42) NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_media
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS vehicle_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_audit_log
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- External Links Table
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

-- Specifications Table
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

-- Comments Table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_token_id ON vehicle_profiles(token_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_owner ON vehicle_profiles(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_vehicle_modifications_vehicle ON vehicle_modifications(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle ON vehicle_media(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_audit_log_vehicle ON vehicle_audit_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_links_vehicle ON vehicle_links(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_specifications_vehicle ON vehicle_specifications(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_comments_vehicle ON vehicle_comments(vehicle_id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_vehicle_profiles_updated_at ON vehicle_profiles;
CREATE TRIGGER update_vehicle_profiles_updated_at
    BEFORE UPDATE ON vehicle_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_modifications_updated_at ON vehicle_modifications;
CREATE TRIGGER update_vehicle_modifications_updated_at
    BEFORE UPDATE ON vehicle_modifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_media_updated_at ON vehicle_media;
CREATE TRIGGER update_vehicle_media_updated_at
    BEFORE UPDATE ON vehicle_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_links_updated_at ON vehicle_links;
CREATE TRIGGER update_vehicle_links_updated_at
    BEFORE UPDATE ON vehicle_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_specifications_updated_at ON vehicle_specifications;
CREATE TRIGGER update_vehicle_specifications_updated_at
    BEFORE UPDATE ON vehicle_specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_comments_updated_at ON vehicle_comments;
CREATE TRIGGER update_vehicle_comments_updated_at
    BEFORE UPDATE ON vehicle_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Modifications policies
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

-- Media policies
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

-- Links policies
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
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can update links on their own vehicles" ON vehicle_links;
CREATE POLICY "Users can update links on their own vehicles"
    ON vehicle_links FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can delete links on their own vehicles" ON vehicle_links;
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
DROP POLICY IF EXISTS "Specifications are viewable by everyone" ON vehicle_specifications;
CREATE POLICY "Specifications are viewable by everyone"
    ON vehicle_specifications FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert specifications to their own vehicles" ON vehicle_specifications;
CREATE POLICY "Users can insert specifications to their own vehicles"
    ON vehicle_specifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can update specifications on their own vehicles" ON vehicle_specifications;
CREATE POLICY "Users can update specifications on their own vehicles"
    ON vehicle_specifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Users can delete specifications on their own vehicles" ON vehicle_specifications;
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
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON vehicle_comments;
CREATE POLICY "Comments are viewable by everyone"
    ON vehicle_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON vehicle_comments;
CREATE POLICY "Users can insert their own comments"
    ON vehicle_comments FOR INSERT
    WITH CHECK (auth.uid()::text = user_wallet);

DROP POLICY IF EXISTS "Users can update their own comments" ON vehicle_comments;
CREATE POLICY "Users can update their own comments"
    ON vehicle_comments FOR UPDATE
    USING (auth.uid()::text = user_wallet);

DROP POLICY IF EXISTS "Users can delete their own comments" ON vehicle_comments;
CREATE POLICY "Users can delete their own comments"
    ON vehicle_comments FOR DELETE
    USING (auth.uid()::text = user_wallet);

-- Audit log policies
DROP POLICY IF EXISTS "Audit logs are viewable by everyone" ON vehicle_audit_log;
CREATE POLICY "Audit logs are viewable by everyone"
    ON vehicle_audit_log FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert audit logs for their own vehicles" ON vehicle_audit_log;
CREATE POLICY "Users can insert audit logs for their own vehicles"
    ON vehicle_audit_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );