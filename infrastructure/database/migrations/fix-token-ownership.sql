-- Fix for token_ownership table
-- This script creates the token_ownership table if it doesn't exist
-- and sets up the necessary triggers and relationships

-- First, check if the token_ownership table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'token_ownership'
    ) THEN
        -- Create the token_ownership table
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

        -- Create indexes for faster lookups
        CREATE INDEX idx_token_ownership_identity_id ON token_ownership(identity_id);
        CREATE INDEX idx_token_ownership_vehicle_id ON token_ownership(vehicle_id);
        
        -- Enable Row Level Security
        ALTER TABLE token_ownership ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Token ownership is viewable by everyone"
            ON token_ownership FOR SELECT
            USING (true);
        
        CREATE POLICY "Only system can modify token ownership"
            ON token_ownership FOR INSERT
            WITH CHECK (is_admin());
        
        CREATE POLICY "Only system can update token ownership"
            ON token_ownership FOR UPDATE
            USING (is_admin());
        
        RAISE NOTICE 'Created token_ownership table and related objects';
    ELSE
        RAISE NOTICE 'token_ownership table already exists';
    END IF;
END $$;

-- Create or replace the sync_token_ownership function
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

-- Check if the trigger exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'sync_token_ownership_trigger'
    ) THEN
        -- Create trigger to keep token_ownership in sync
        CREATE TRIGGER sync_token_ownership_trigger
        AFTER INSERT OR UPDATE OF owner_id ON vehicle_profiles
        FOR EACH ROW
        EXECUTE FUNCTION sync_token_ownership();
        
        RAISE NOTICE 'Created sync_token_ownership_trigger';
    ELSE
        RAISE NOTICE 'sync_token_ownership_trigger already exists';
    END IF;
END $$;

-- Populate token_ownership table with existing vehicle data
INSERT INTO token_ownership (token_id, identity_id, vehicle_id)
SELECT 
    vp.token_id, 
    vp.owner_id, 
    vp.id
FROM 
    vehicle_profiles vp
LEFT JOIN 
    token_ownership to_check ON vp.token_id = to_check.token_id
WHERE 
    to_check.token_id IS NULL;

-- Verify the token_ownership table
SELECT COUNT(*) AS token_ownership_count FROM token_ownership;