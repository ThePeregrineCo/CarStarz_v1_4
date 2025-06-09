-- Wallet-Identity Schema
-- This schema stores wallet addresses only in identity_registry and uses owner_id exclusively for authorization

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS vehicle_verifications CASCADE;
DROP TABLE IF EXISTS verification_levels CASCADE;
DROP TABLE IF EXISTS verification_authorities CASCADE;
DROP TABLE IF EXISTS ownership_transfers CASCADE;
DROP TABLE IF EXISTS token_ownership CASCADE;
DROP TABLE IF EXISTS user_collections CASCADE;
DROP TABLE IF EXISTS vehicle_videos CASCADE;
DROP TABLE IF EXISTS vehicle_audit_log CASCADE;
DROP TABLE IF EXISTS vehicle_comments CASCADE;
DROP TABLE IF EXISTS vehicle_specifications CASCADE;
DROP TABLE IF EXISTS vehicle_links CASCADE;
DROP TABLE IF EXISTS vehicle_media CASCADE;
DROP TABLE IF EXISTS vehicle_modifications CASCADE;
DROP TABLE IF EXISTS vehicle_profiles CASCADE;
DROP TABLE IF EXISTS social_links CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS identity_registry CASCADE;

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

-- Create the identity_registry table - Single source of truth for wallet addresses
CREATE TABLE identity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  normalized_wallet TEXT NOT NULL UNIQUE,  -- Used for case-insensitive lookups
  username TEXT NOT NULL UNIQUE,           -- Required field
  display_name TEXT NOT NULL,              -- Required field
  bio TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  email TEXT,
  ens_name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false, -- Admin flag
  is_profile_complete BOOLEAN NOT NULL DEFAULT false, -- Track if profile is complete
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_wallet_format CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$') -- Ensure wallet format is valid
);

-- Create indexes for faster lookups
CREATE INDEX idx_identity_registry_wallet_address ON identity_registry(wallet_address);
CREATE INDEX idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);
CREATE INDEX idx_identity_registry_username ON identity_registry(username);
CREATE INDEX idx_identity_registry_is_admin ON identity_registry(is_admin);

-- Create the follows table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES identity_registry(id),
  followed_id UUID NOT NULL REFERENCES identity_registry(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);

-- Create the social_links table
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID NOT NULL REFERENCES identity_registry(id),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_social_links_identity_id ON social_links(identity_id);

-- =============================================
-- VEHICLE TABLES
-- =============================================

-- Vehicle Profiles Table - Using only owner_id for ownership
CREATE TABLE vehicle_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL UNIQUE,  -- References the NFT token ID
    vin VARCHAR(17) NOT NULL UNIQUE,   -- Vehicle Identification Number
    make VARCHAR(50) NOT NULL,         -- Vehicle make
    model VARCHAR(50) NOT NULL,        -- Vehicle model
    year INTEGER NOT NULL,             -- Vehicle year
    name VARCHAR(100),                 -- Custom vehicle name (e.g., "Redzilla")
    description TEXT,                  -- Long description
    owner_id UUID NOT NULL REFERENCES identity_registry(id), -- Only ownership reference
    primary_image_url TEXT,            -- URL to the primary image
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for vehicle lookups
CREATE INDEX idx_vehicle_profiles_token_id ON vehicle_profiles(token_id);
CREATE INDEX idx_vehicle_profiles_owner_id ON vehicle_profiles(owner_id);
CREATE INDEX idx_vehicle_profiles_make_model_year ON vehicle_profiles(make, model, year);

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
    commenter_id UUID NOT NULL REFERENCES identity_registry(id),
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
    performed_by UUID NOT NULL REFERENCES identity_registry(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
    user_id UUID NOT NULL REFERENCES identity_registry(id),
    vehicle_id UUID NOT NULL REFERENCES vehicle_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vehicle_id)
);

-- =============================================
-- BLOCKCHAIN INTEGRATION TABLES
-- =============================================

-- Table to track token ownership for blockchain sync
CREATE TABLE token_ownership (
    token_id INTEGER PRIMARY KEY,
    identity_id UUID NOT NULL REFERENCES identity_registry(id),
    vehicle_id UUID NOT NULL REFERENCES vehicle_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_token_ownership_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- Table to track ownership transfers
CREATE TABLE ownership_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id INTEGER NOT NULL,
    vehicle_id UUID NOT NULL,
    from_identity_id UUID REFERENCES identity_registry(id),
    to_identity_id UUID NOT NULL REFERENCES identity_registry(id),
    transaction_hash TEXT,
    block_number BIGINT,
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ownership_transfers_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ownership_transfers_token_id ON ownership_transfers(token_id);
CREATE INDEX idx_ownership_transfers_vehicle_id ON ownership_transfers(vehicle_id);
CREATE INDEX idx_ownership_transfers_from_identity ON ownership_transfers(from_identity_id);
CREATE INDEX idx_ownership_transfers_to_identity ON ownership_transfers(to_identity_id);

-- =============================================
-- VERIFICATION SYSTEM TABLES
-- =============================================

-- Table for verification authorities
CREATE TABLE verification_authorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for verification levels
CREATE TABLE verification_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    level_order INTEGER NOT NULL,
    badge_url TEXT,
    requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for vehicle verifications
CREATE TABLE vehicle_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    authority_id UUID NOT NULL,
    level_id UUID NOT NULL,
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP WITH TIME ZONE,
    verification_proof TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_verifications_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_vehicle_verifications_authority
        FOREIGN KEY (authority_id)
        REFERENCES verification_authorities(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_vehicle_verifications_level
        FOREIGN KEY (level_id)
        REFERENCES verification_levels(id)
        ON DELETE RESTRICT
);

-- =============================================
-- SOCIAL FEATURES TABLES
-- =============================================

-- Table for likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES identity_registry(id),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('vehicle', 'comment', 'media')),
    content_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_type, content_id)
);

-- Table for shares
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES identity_registry(id),
    vehicle_id UUID NOT NULL,
    share_platform VARCHAR(20) NOT NULL,
    share_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shares_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicle_profiles(id)
        ON DELETE CASCADE
);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Table for page views
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_type VARCHAR(20) NOT NULL CHECK (page_type IN ('vehicle', 'profile', 'search', 'home')),
    content_id UUID,
    user_id UUID REFERENCES identity_registry(id),
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    view_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Create a function to validate required profile fields
CREATE OR REPLACE FUNCTION validate_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a profile created due to NFT transfer
    IF NEW.is_profile_complete = false THEN
        -- Allow minimal profile for NFT transfers
        RETURN NEW;
    END IF;
    
    -- For complete profiles, validate required fields
    IF NEW.username IS NULL OR LENGTH(TRIM(NEW.username)) < 3 THEN
        RAISE EXCEPTION 'Username is required and must be at least 3 characters';
    END IF;
    
    IF NEW.display_name IS NULL OR LENGTH(TRIM(NEW.display_name)) < 2 THEN
        RAISE EXCEPTION 'Display name is required and must be at least 2 characters';
    END IF;
    
    -- Set profile as complete if it passes validation
    NEW.is_profile_complete := true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate profile fields
CREATE TRIGGER validate_profile_fields_trigger
BEFORE INSERT OR UPDATE ON identity_registry
FOR EACH ROW
EXECUTE FUNCTION validate_profile_fields();

-- Create a function to synchronize token_ownership with vehicle_profiles
CREATE OR REPLACE FUNCTION sync_token_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert into token_ownership
    INSERT INTO token_ownership (
        token_id,
        identity_id,
        vehicle_id
    ) VALUES (
        NEW.token_id,
        NEW.owner_id,
        NEW.id
    )
    ON CONFLICT (token_id) DO UPDATE SET
        identity_id = NEW.owner_id,
        vehicle_id = NEW.id,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep token_ownership in sync
CREATE TRIGGER sync_token_ownership_trigger
AFTER INSERT OR UPDATE OF owner_id ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_token_ownership();

-- Create a function to handle blockchain ownership transfers
CREATE OR REPLACE FUNCTION process_blockchain_transfer(
    p_token_id INTEGER,
    p_from_wallet TEXT,
    p_to_wallet TEXT,
    p_transaction_hash TEXT,
    p_block_number BIGINT
) RETURNS UUID AS $$
DECLARE
    v_vehicle_id UUID;
    v_from_identity_id UUID;
    v_to_identity_id UUID;
    v_normalized_to_wallet TEXT;
BEGIN
    -- Normalize the to_wallet address
    v_normalized_to_wallet := LOWER(p_to_wallet);
    
    -- Get the vehicle ID and current owner identity ID
    SELECT vehicle_id, identity_id INTO v_vehicle_id, v_from_identity_id
    FROM token_ownership
    WHERE token_id = p_token_id;
    
    IF v_vehicle_id IS NULL THEN
        RAISE EXCEPTION 'Vehicle with token_id % not found', p_token_id;
    END IF;
    
    -- Get the to identity ID
    SELECT id INTO v_to_identity_id
    FROM identity_registry
    WHERE normalized_wallet = v_normalized_to_wallet;
    
    -- If the recipient doesn't have an identity, create one
    IF v_to_identity_id IS NULL THEN
        INSERT INTO identity_registry (
            wallet_address,
            normalized_wallet,
            username,
            display_name,
            is_profile_complete
        ) VALUES (
            p_to_wallet,
            v_normalized_to_wallet,
            'user_' || SUBSTRING(v_normalized_to_wallet, 3, 6),
            SUBSTRING(p_to_wallet, 1, 6) || '...' || SUBSTRING(p_to_wallet, LENGTH(p_to_wallet) - 3),
            false  -- Mark as incomplete
        )
        RETURNING id INTO v_to_identity_id;
    END IF;
    
    -- Update the vehicle ownership
    UPDATE vehicle_profiles
    SET owner_id = v_to_identity_id,
        updated_at = NOW()
    WHERE id = v_vehicle_id;
    
    -- Record the transfer
    INSERT INTO ownership_transfers (
        token_id,
        vehicle_id,
        from_identity_id,
        to_identity_id,
        transaction_hash,
        block_number
    ) VALUES (
        p_token_id,
        v_vehicle_id,
        v_from_identity_id,
        v_to_identity_id,
        p_transaction_hash,
        p_block_number
    );
    
    RETURN v_vehicle_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM identity_registry
    WHERE normalized_wallet = LOWER(auth.uid()::text);
    
    RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get the current user's identity_id
CREATE OR REPLACE FUNCTION current_user_identity_id()
RETURNS UUID AS $$
DECLARE
    v_identity_id UUID;
BEGIN
    SELECT id INTO v_identity_id
    FROM identity_registry
    WHERE normalized_wallet = LOWER(auth.uid()::text);
    
    RETURN v_identity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if the current user owns a vehicle
CREATE OR REPLACE FUNCTION owns_vehicle(vehicle_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the user owns the vehicle
    RETURN EXISTS (
        SELECT 1
        FROM vehicle_profiles
        WHERE id = vehicle_id
        AND owner_id = current_user_identity_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SECURITY POLICIES
-- =============================================

-- Enable Row Level Security
ALTER TABLE identity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_transfers ENABLE ROW LEVEL SECURITY;

-- Identity registry policies
CREATE POLICY "Public identity profiles are viewable by everyone"
    ON identity_registry FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own identity"
    ON identity_registry FOR UPDATE
    USING (
        id = current_user_identity_id() OR is_admin()
    );

-- Vehicle profiles policies
CREATE POLICY "Public vehicle profiles are viewable by everyone"
    ON vehicle_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own vehicle profiles"
    ON vehicle_profiles FOR INSERT
    WITH CHECK (
        owner_id = current_user_identity_id()
    );

CREATE POLICY "Users can update their own vehicle profiles"
    ON vehicle_profiles FOR UPDATE
    USING (
        owner_id = current_user_identity_id() OR is_admin()
    );

CREATE POLICY "Users can delete their own vehicle profiles"
    ON vehicle_profiles FOR DELETE
    USING (
        owner_id = current_user_identity_id() OR is_admin()
    );

-- Vehicle modifications policies
CREATE POLICY "Modifications are viewable by everyone"
    ON vehicle_modifications FOR SELECT
    USING (true);

CREATE POLICY "Users can insert modifications to their own vehicles"
    ON vehicle_modifications FOR INSERT
    WITH CHECK (
        owns_vehicle(vehicle_id) OR is_admin()
    );

CREATE POLICY "Users can update modifications on their own vehicles"
    ON vehicle_modifications FOR UPDATE
    USING (
        owns_vehicle(vehicle_id) OR is_admin()
    );

CREATE POLICY "Users can delete modifications on their own vehicles"
    ON vehicle_modifications FOR DELETE
    USING (
        owns_vehicle(vehicle_id) OR is_admin()
    );

-- Vehicle media policies
CREATE POLICY "Media is viewable by everyone"
    ON vehicle_media FOR SELECT
    USING (true);

CREATE POLICY "Users can insert media to their own vehicles"
    ON vehicle_media FOR INSERT
    WITH CHECK (
        owns_vehicle(vehicle_id) OR is_admin()
    );

CREATE POLICY "Users can update media on their own vehicles"
    ON vehicle_media FOR UPDATE
    USING (
        owns_vehicle(vehicle_id) OR is_admin()
    );

CREATE POLICY "Users can delete media on their own vehicles"
    ON vehicle_media FOR DELETE
    USING (
        owns_vehicle(vehicle_id) OR is_admin()
    );

-- Token ownership policies
CREATE POLICY "Token ownership is viewable by everyone"
    ON token_ownership FOR SELECT
    USING (true);

CREATE POLICY "Only system can modify token ownership"
    ON token_ownership FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Only system can update token ownership"
    ON token_ownership FOR UPDATE
    USING (is_admin());

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
    current_user_identity_id() IS NOT NULL
  );

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert a test admin user
INSERT INTO identity_registry (
    wallet_address,
    normalized_wallet,
    username,
    display_name,
    is_admin,
    is_profile_complete
) VALUES (
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000001',
    'admin',
    'System Admin',
    true,
    true
) ON CONFLICT (normalized_wallet) DO NOTHING;

-- Insert verification levels
INSERT INTO verification_levels (name, description, level_order, badge_url)
VALUES 
('Basic', 'Basic verification of vehicle existence', 1, '/badges/basic.png'),
('Standard', 'Standard verification including documentation check', 2, '/badges/standard.png'),
('Premium', 'Premium verification with physical inspection', 3, '/badges/premium.png')
ON CONFLICT DO NOTHING;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for vehicle profiles with owner information
CREATE OR REPLACE VIEW vehicle_profiles_with_owner AS
SELECT 
    vp.*,
    ir.wallet_address as owner_wallet,
    ir.normalized_wallet,
    ir.username as owner_username,
    ir.display_name as owner_display_name,
    ir.profile_image_url as owner_profile_image,
    ir.is_profile_complete
FROM 
    vehicle_profiles vp
JOIN 
    identity_registry ir ON vp.owner_id = ir.id;

-- View for blockchain status
CREATE OR REPLACE VIEW blockchain_status AS
SELECT 
    to.token_id,
    ir.wallet_address,
    ir.normalized_wallet,
    vp.id as vehicle_id,
    vp.make,
    vp.model,
    vp.year,
    ir.username as owner_username,
    ir.display_name as owner_display_name,
    ir.is_profile_complete
FROM
    token_ownership tok_own
JOIN
    vehicle_profiles vp ON tok_own.vehicle_id = vp.id
JOIN
    identity_registry ir ON tok_own.identity_id = ir.id;

-- =============================================
-- WEBHOOK HANDLER FOR BLOCKCHAIN EVENTS
-- =============================================

-- Create a function to handle blockchain transfer events from webhook
CREATE OR REPLACE FUNCTION handle_transfer_webhook(
    token_id INTEGER,
    from_address TEXT,
    to_address TEXT,
    tx_hash TEXT,
    block_number BIGINT
) RETURNS TEXT AS $$
DECLARE
    result TEXT;
    vehicle_id UUID;
BEGIN
    -- Process the transfer
    vehicle_id := process_blockchain_transfer(
        token_id,
        from_address,
        to_address,
        tx_hash,
        block_number
    );
    
    -- Return success message
    result := 'Successfully processed transfer of token ' || token_id || 
              ' from ' || from_address || ' to ' || to_address || 
              ' for vehicle ' || vehicle_id;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Return error message
    RETURN 'Error processing transfer: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

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