-- CarStarz Database Restructuring

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users Table (Enhanced from existing wallet-based authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username VARCHAR(30) UNIQUE,
  user_type VARCHAR(20) DEFAULT 'owner',
  subscription_tier VARCHAR(20) DEFAULT 'free',
  profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create Builder/Shop Table
CREATE TABLE IF NOT EXISTS builders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(100) NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  contact_info JSONB DEFAULT '{}',
  subscription_tier VARCHAR(20) DEFAULT 'standard',
  specialties TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify Vehicle Profiles Table to align with new schema
-- We'll preserve the existing structure but add new columns
ALTER TABLE vehicle_profiles
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS primary_image_url TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Create Parts Table
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Vehicle-Parts Relationship Table
CREATE TABLE IF NOT EXISTS vehicle_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Builder-Vehicle Relationship Table
CREATE TABLE IF NOT EXISTS builder_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  builder_id UUID REFERENCES builders(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  build_date DATE,
  build_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Follow Relationship Table
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  follow_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create Builder Follow Relationship Table
CREATE TABLE IF NOT EXISTS builder_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  builder_id UUID REFERENCES builders(id) ON DELETE CASCADE,
  follow_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, builder_id)
);

-- Update vehicle_media table to add more metadata fields
ALTER TABLE vehicle_media
  ADD COLUMN IF NOT EXISTS context VARCHAR(50),
  ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migration function to populate users table from existing vehicle_profiles
CREATE OR REPLACE FUNCTION migrate_owners_to_users()
RETURNS void AS $$
BEGIN
  -- Insert owners from vehicle_profiles into users table
  INSERT INTO users (wallet_address, user_type, created_at, updated_at)
  SELECT DISTINCT owner_wallet, 'owner', MIN(created_at), MIN(updated_at)
  FROM vehicle_profiles
  WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE wallet_address = vehicle_profiles.owner_wallet
  )
  GROUP BY owner_wallet;
  
  -- Update vehicle_profiles with the corresponding user_id
  UPDATE vehicle_profiles vp
  SET owner_id = u.id
  FROM users u
  WHERE vp.owner_wallet = u.wallet_address
  AND vp.owner_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_vehicle ON vehicle_parts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_part ON vehicle_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_builder_vehicles_builder ON builder_vehicles(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_vehicles_vehicle ON builder_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_builder_follows_user ON builder_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_follows_builder ON builder_follows(builder_id);

-- Update trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to new tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builders_updated_at
    BEFORE UPDATE ON builders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_parts_updated_at
    BEFORE UPDATE ON vehicle_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builder_vehicles_updated_at
    BEFORE UPDATE ON builder_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE builders ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_follows ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = wallet_address);

-- Builders policies
CREATE POLICY "Builders are viewable by everyone"
    ON builders FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own builder profile"
    ON builders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = builders.user_id
            AND wallet_address = auth.uid()::text
        )
    );

-- Parts policies
CREATE POLICY "Parts are viewable by everyone"
    ON parts FOR SELECT
    USING (true);

CREATE POLICY "Users can insert parts"
    ON parts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Vehicle-Parts policies
CREATE POLICY "Vehicle parts are viewable by everyone"
    ON vehicle_parts FOR SELECT
    USING (true);

CREATE POLICY "Users can insert parts to their own vehicles"
    ON vehicle_parts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND owner_wallet = auth.uid()::text
        )
    );

-- Builder-Vehicles policies
CREATE POLICY "Builder vehicles are viewable by everyone"
    ON builder_vehicles FOR SELECT
    USING (true);

CREATE POLICY "Builders can insert vehicles to their portfolio"
    ON builder_vehicles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM builders b
            JOIN users u ON b.user_id = u.id
            WHERE b.id = builder_id
            AND u.wallet_address = auth.uid()::text
        )
    );

-- User follows policies
CREATE POLICY "User follows are viewable by everyone"
    ON user_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow other users"
    ON user_follows FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = follower_id
            AND wallet_address = auth.uid()::text
        )
    );

-- Builder follows policies
CREATE POLICY "Builder follows are viewable by everyone"
    ON builder_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow builders"
    ON builder_follows FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = user_id
            AND wallet_address = auth.uid()::text
        )
    );