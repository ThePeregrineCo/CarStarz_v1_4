-- =============================================
-- WALLET NORMALIZATION FIXES
-- =============================================
-- This script adds improvements to wallet address handling and authentication

-- Create a function to normalize wallet addresses
CREATE OR REPLACE FUNCTION normalize_wallet_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Always set normalized_wallet to lowercase wallet_address
    NEW.normalized_wallet := LOWER(NEW.wallet_address);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically normalize wallet addresses on insert or update
DROP TRIGGER IF EXISTS normalize_wallet_address_trigger ON identity_registry;
CREATE TRIGGER normalize_wallet_address_trigger
BEFORE INSERT OR UPDATE ON identity_registry
FOR EACH ROW
EXECUTE FUNCTION normalize_wallet_address();

-- Update vehicle profiles policies to use case-insensitive comparisons
DROP POLICY IF EXISTS "Users can insert their own profiles" ON vehicle_profiles;
CREATE POLICY "Users can insert their own profiles"
    ON vehicle_profiles FOR INSERT
    WITH CHECK (LOWER(auth.uid()::text) = LOWER(owner_wallet));

DROP POLICY IF EXISTS "Users can update their own profiles" ON vehicle_profiles;
CREATE POLICY "Users can update their own profiles"
    ON vehicle_profiles FOR UPDATE
    USING (LOWER(auth.uid()::text) = LOWER(owner_wallet));

DROP POLICY IF EXISTS "Users can delete their own profiles" ON vehicle_profiles;
CREATE POLICY "Users can delete their own profiles"
    ON vehicle_profiles FOR DELETE
    USING (LOWER(auth.uid()::text) = LOWER(owner_wallet));

-- Update vehicle modifications policies
DROP POLICY IF EXISTS "Users can insert modifications to their own vehicles" ON vehicle_modifications;
CREATE POLICY "Users can insert modifications to their own vehicles"
    ON vehicle_modifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can update modifications on their own vehicles" ON vehicle_modifications;
CREATE POLICY "Users can update modifications on their own vehicles"
    ON vehicle_modifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can delete modifications on their own vehicles" ON vehicle_modifications;
CREATE POLICY "Users can delete modifications on their own vehicles"
    ON vehicle_modifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

-- Update vehicle media policies
DROP POLICY IF EXISTS "Users can insert media to their own vehicles" ON vehicle_media;
CREATE POLICY "Users can insert media to their own vehicles"
    ON vehicle_media FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can update media on their own vehicles" ON vehicle_media;
CREATE POLICY "Users can update media on their own vehicles"
    ON vehicle_media FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can delete media on their own vehicles" ON vehicle_media;
CREATE POLICY "Users can delete media on their own vehicles"
    ON vehicle_media FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

-- Update vehicle links policies
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

-- Update vehicle specifications policies
DROP POLICY IF EXISTS "Users can insert specifications to their own vehicles" ON vehicle_specifications;
CREATE POLICY "Users can insert specifications to their own vehicles"
    ON vehicle_specifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can update specifications on their own vehicles" ON vehicle_specifications;
CREATE POLICY "Users can update specifications on their own vehicles"
    ON vehicle_specifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can delete specifications on their own vehicles" ON vehicle_specifications;
CREATE POLICY "Users can delete specifications on their own vehicles"
    ON vehicle_specifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

-- Update vehicle comments policies
DROP POLICY IF EXISTS "Users can insert their own comments" ON vehicle_comments;
CREATE POLICY "Users can insert their own comments"
    ON vehicle_comments FOR INSERT
    WITH CHECK (LOWER(auth.uid()::text) = LOWER(user_wallet));

DROP POLICY IF EXISTS "Users can delete their own comments" ON vehicle_comments;
CREATE POLICY "Users can delete their own comments"
    ON vehicle_comments FOR DELETE
    USING (LOWER(auth.uid()::text) = LOWER(user_wallet));

-- Update vehicle videos policies
DROP POLICY IF EXISTS "Users can insert videos to their own vehicles" ON vehicle_videos;
CREATE POLICY "Users can insert videos to their own vehicles"
    ON vehicle_videos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can update videos on their own vehicles" ON vehicle_videos;
CREATE POLICY "Users can update videos on their own vehicles"
    ON vehicle_videos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can delete videos on their own vehicles" ON vehicle_videos;
CREATE POLICY "Users can delete videos on their own vehicles"
    ON vehicle_videos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE id = vehicle_id
            AND LOWER(owner_wallet) = LOWER(auth.uid()::text)
        )
    );

-- Update user collections policies
DROP POLICY IF EXISTS "Users can insert their own collections" ON user_collections;
CREATE POLICY "Users can insert their own collections"
    ON user_collections FOR INSERT
    WITH CHECK (LOWER(auth.uid()::text) = LOWER(user_wallet));

DROP POLICY IF EXISTS "Users can delete their own collections" ON user_collections;
CREATE POLICY "Users can delete their own collections"
    ON user_collections FOR DELETE
    USING (LOWER(auth.uid()::text) = LOWER(user_wallet));

-- Update user follows policies
DROP POLICY IF EXISTS "Users can insert their own follows" ON user_follows;
CREATE POLICY "Users can insert their own follows"
    ON user_follows FOR INSERT
    WITH CHECK (LOWER(auth.uid()::text) = LOWER(follower_wallet));

DROP POLICY IF EXISTS "Users can delete their own follows" ON user_follows;
CREATE POLICY "Users can delete their own follows"
    ON user_follows FOR DELETE
    USING (LOWER(auth.uid()::text) = LOWER(follower_wallet));

-- Ensure Identity Registry is Source of Truth for User ID
-- Add a trigger to automatically set owner_id based on identity_registry
CREATE OR REPLACE FUNCTION set_vehicle_owner_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Set owner_id to the id from identity_registry based on wallet address
    SELECT id INTO NEW.owner_id
    FROM identity_registry
    WHERE LOWER(wallet_address) = LOWER(NEW.owner_wallet);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vehicle_owner_id_trigger ON vehicle_profiles;
CREATE TRIGGER set_vehicle_owner_id_trigger
BEFORE INSERT OR UPDATE ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION set_vehicle_owner_id();

-- Create a function to check for wallet address inconsistencies
CREATE OR REPLACE FUNCTION check_wallet_address_consistency()
RETURNS TABLE (
    vehicle_id UUID,
    token_id INTEGER,
    owner_wallet TEXT,
    identity_id UUID,
    wallet_address TEXT,
    normalized_wallet TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vp.id as vehicle_id,
        vp.token_id,
        vp.owner_wallet,
        vp.owner_id as identity_id,
        ir.wallet_address,
        ir.normalized_wallet,
        CASE
            WHEN ir.id IS NULL THEN 'Missing identity'
            WHEN LOWER(vp.owner_wallet) != ir.normalized_wallet THEN 'Mismatched wallet case'
            WHEN vp.owner_id != ir.id THEN 'Mismatched identity ID'
            ELSE 'OK'
        END as status
    FROM
        vehicle_profiles vp
    LEFT JOIN
        identity_registry ir ON LOWER(vp.owner_wallet) = ir.normalized_wallet
    WHERE
        ir.id IS NULL OR 
        LOWER(vp.owner_wallet) != ir.normalized_wallet OR
        vp.owner_id != ir.id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix wallet address inconsistencies
CREATE OR REPLACE FUNCTION fix_wallet_address_inconsistencies()
RETURNS INTEGER AS $$
DECLARE
    fixed_count INTEGER := 0;
    r RECORD;
BEGIN
    -- First, ensure all identity_registry entries have correct normalized_wallet
    UPDATE identity_registry
    SET normalized_wallet = LOWER(wallet_address)
    WHERE normalized_wallet != LOWER(wallet_address);
    
    -- Get count of fixed identity_registry entries
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    -- Then, update vehicle_profiles owner_id based on normalized wallet
    FOR r IN 
        SELECT 
            vp.id as vehicle_id,
            ir.id as identity_id
        FROM
            vehicle_profiles vp
        JOIN
            identity_registry ir ON LOWER(vp.owner_wallet) = LOWER(ir.wallet_address)
        WHERE
            vp.owner_id IS NULL OR vp.owner_id != ir.id
    LOOP
        UPDATE vehicle_profiles
        SET owner_id = r.identity_id
        WHERE id = r.vehicle_id;
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;