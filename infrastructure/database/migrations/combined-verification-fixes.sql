-- =============================================
-- COMBINED VERIFICATION FIXES
-- =============================================
-- This script combines all verification fixes into a single file

-- =============================================
-- 1. WALLET NORMALIZATION FIXES
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

-- =============================================
-- 2. VEHICLE-MEDIA RELATIONSHIP FIXES
-- =============================================

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

-- Ensure the index on vehicle_id exists and is efficient
DROP INDEX IF EXISTS idx_vehicle_media_vehicle_id;
CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle_id ON vehicle_media(vehicle_id);

-- Add a constraint to ensure vehicle_id exists in vehicle_profiles
-- This is redundant with the foreign key, but we'll add it explicitly for clarity
ALTER TABLE vehicle_media
DROP CONSTRAINT IF EXISTS fk_vehicle_media_vehicle_profiles;

ALTER TABLE vehicle_media
ADD CONSTRAINT fk_vehicle_media_vehicle_profiles
FOREIGN KEY (vehicle_id)
REFERENCES vehicle_profiles(id)
ON DELETE CASCADE;

-- Create a function to verify cascade delete functionality
CREATE OR REPLACE FUNCTION test_cascade_delete(test_vehicle_id UUID)
RETURNS TABLE (
    test_result TEXT,
    vehicle_count INTEGER,
    media_count INTEGER
) AS $$
DECLARE
    vehicle_count_before INTEGER;
    media_count_before INTEGER;
    vehicle_count_after INTEGER;
    media_count_after INTEGER;
BEGIN
    -- Count records before delete
    SELECT COUNT(*) INTO vehicle_count_before FROM vehicle_profiles WHERE id = test_vehicle_id;
    SELECT COUNT(*) INTO media_count_before FROM vehicle_media WHERE vehicle_id = test_vehicle_id;
    
    -- Perform delete
    DELETE FROM vehicle_profiles WHERE id = test_vehicle_id;
    
    -- Count records after delete
    SELECT COUNT(*) INTO vehicle_count_after FROM vehicle_profiles WHERE id = test_vehicle_id;
    SELECT COUNT(*) INTO media_count_after FROM vehicle_media WHERE vehicle_id = test_vehicle_id;
    
    -- Return results
    RETURN QUERY
    SELECT 
        CASE 
            WHEN vehicle_count_after = 0 AND media_count_after = 0 THEN 'Cascade delete working correctly'
            ELSE 'Cascade delete failed'
        END as test_result,
        vehicle_count_before - vehicle_count_after as vehicle_count,
        media_count_before - media_count_after as media_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check media retrieval efficiency
CREATE OR REPLACE FUNCTION check_media_query_efficiency(test_vehicle_id UUID)
RETURNS TABLE (
    query_plan TEXT
) AS $$
BEGIN
    RETURN QUERY
    EXPLAIN ANALYZE
    SELECT * FROM vehicle_media
    WHERE vehicle_id = test_vehicle_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all media for a vehicle with vehicle details
CREATE OR REPLACE FUNCTION get_vehicle_media(vehicle_token_id INTEGER)
RETURNS TABLE (
    vehicle_id UUID,
    token_id INTEGER,
    make TEXT,
    model TEXT,
    year INTEGER,
    media_id UUID,
    media_url TEXT,
    media_type TEXT,
    caption TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vp.id as vehicle_id,
        vp.token_id,
        vp.make,
        vp.model,
        vp.year,
        vm.id as media_id,
        vm.url as media_url,
        vm.type as media_type,
        vm.caption
    FROM 
        vehicle_profiles vp
    JOIN 
        vehicle_media vm ON vp.id = vm.vehicle_id
    WHERE 
        vp.token_id = vehicle_token_id
    ORDER BY 
        vm.is_featured DESC, 
        vm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to ensure media records have a valid vehicle_id
CREATE OR REPLACE FUNCTION validate_vehicle_media()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if vehicle_id exists in vehicle_profiles
    IF NOT EXISTS (SELECT 1 FROM vehicle_profiles WHERE id = NEW.vehicle_id) THEN
        RAISE EXCEPTION 'Vehicle ID % does not exist in vehicle_profiles', NEW.vehicle_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_vehicle_media_trigger ON vehicle_media;
CREATE TRIGGER validate_vehicle_media_trigger
BEFORE INSERT OR UPDATE ON vehicle_media
FOR EACH ROW
EXECUTE FUNCTION validate_vehicle_media();

-- =============================================
-- 3. IDENTITY REGISTRY INTEGRATION FIXES
-- =============================================

-- Create a function to check for vehicles with missing identity links
CREATE OR REPLACE FUNCTION check_missing_identity_links()
RETURNS TABLE (
    vehicle_id UUID,
    token_id INTEGER,
    owner_wallet TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vp.id as vehicle_id,
        vp.token_id,
        vp.owner_wallet,
        'Missing identity link' as status
    FROM
        vehicle_profiles vp
    LEFT JOIN
        identity_registry ir ON LOWER(vp.owner_wallet) = ir.normalized_wallet
    WHERE
        ir.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to create missing identity registry entries
CREATE OR REPLACE FUNCTION create_missing_identity_entries()
RETURNS INTEGER AS $$
DECLARE
    created_count INTEGER := 0;
    r RECORD;
BEGIN
    -- Find vehicles with missing identity links
    FOR r IN 
        SELECT DISTINCT owner_wallet
        FROM vehicle_profiles vp
        LEFT JOIN identity_registry ir ON LOWER(vp.owner_wallet) = ir.normalized_wallet
        WHERE ir.id IS NULL
    LOOP
        -- Create new identity registry entry
        INSERT INTO identity_registry (wallet_address, normalized_wallet)
        VALUES (r.owner_wallet, LOWER(r.owner_wallet));
        
        created_count := created_count + 1;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update vehicle owner_id based on identity registry
CREATE OR REPLACE FUNCTION update_vehicle_owner_ids()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update vehicle_profiles owner_id based on identity registry
    WITH updated_vehicles AS (
        UPDATE vehicle_profiles vp
        SET owner_id = ir.id
        FROM identity_registry ir
        WHERE LOWER(vp.owner_wallet) = ir.normalized_wallet
        AND (vp.owner_id IS NULL OR vp.owner_id != ir.id)
        RETURNING vp.id
    )
    SELECT COUNT(*) INTO updated_count FROM updated_vehicles;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set owner_id when owner_wallet is updated
CREATE OR REPLACE FUNCTION set_owner_id_from_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Set owner_id to the id from identity_registry based on wallet address
    SELECT id INTO NEW.owner_id
    FROM identity_registry
    WHERE normalized_wallet = LOWER(NEW.owner_wallet);
    
    -- If no matching identity found, create one
    IF NEW.owner_id IS NULL THEN
        INSERT INTO identity_registry (wallet_address, normalized_wallet)
        VALUES (NEW.owner_wallet, LOWER(NEW.owner_wallet))
        RETURNING id INTO NEW.owner_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_owner_id_from_wallet_trigger ON vehicle_profiles;
CREATE TRIGGER set_owner_id_from_wallet_trigger
BEFORE INSERT OR UPDATE OF owner_wallet ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION set_owner_id_from_wallet();

-- Create a function to check for wallet address mismatches
CREATE OR REPLACE FUNCTION check_wallet_address_mismatches()
RETURNS TABLE (
    vehicle_id UUID,
    token_id INTEGER,
    owner_wallet TEXT,
    identity_id UUID,
    identity_wallet TEXT,
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
        ir.wallet_address as identity_wallet,
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
        identity_registry ir ON vp.owner_id = ir.id
    WHERE
        ir.id IS NULL OR 
        LOWER(vp.owner_wallet) != ir.normalized_wallet OR
        vp.owner_id != ir.id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix wallet address mismatches
CREATE OR REPLACE FUNCTION fix_wallet_address_mismatches()
RETURNS INTEGER AS $$
DECLARE
    fixed_count INTEGER := 0;
    r RECORD;
BEGIN
    -- Find vehicles with wallet address mismatches
    FOR r IN 
        SELECT 
            vp.id as vehicle_id,
            vp.owner_wallet,
            ir.id as identity_id,
            ir.wallet_address as identity_wallet
        FROM
            vehicle_profiles vp
        JOIN
            identity_registry ir ON vp.owner_id = ir.id
        WHERE
            LOWER(vp.owner_wallet) != ir.normalized_wallet
    LOOP
        -- Update vehicle_profiles owner_wallet to match identity_registry
        UPDATE vehicle_profiles
        SET owner_wallet = r.identity_wallet
        WHERE id = r.vehicle_id;
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to verify identity registry is the source of truth
CREATE OR REPLACE FUNCTION verify_identity_source_of_truth()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    count INTEGER
) AS $$
DECLARE
    missing_identity_count INTEGER;
    mismatched_wallet_count INTEGER;
    mismatched_id_count INTEGER;
BEGIN
    -- Count vehicles with missing identity
    SELECT COUNT(*) INTO missing_identity_count
    FROM vehicle_profiles vp
    LEFT JOIN identity_registry ir ON LOWER(vp.owner_wallet) = ir.normalized_wallet
    WHERE ir.id IS NULL;
    
    -- Count vehicles with mismatched wallet
    SELECT COUNT(*) INTO mismatched_wallet_count
    FROM vehicle_profiles vp
    JOIN identity_registry ir ON vp.owner_id = ir.id
    WHERE LOWER(vp.owner_wallet) != ir.normalized_wallet;
    
    -- Count vehicles with mismatched ID
    SELECT COUNT(*) INTO mismatched_id_count
    FROM vehicle_profiles vp
    JOIN identity_registry ir ON LOWER(vp.owner_wallet) = ir.normalized_wallet
    WHERE vp.owner_id != ir.id;
    
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
    SELECT 'Mismatched identity IDs' as check_name,
           CASE WHEN mismatched_id_count = 0 THEN 'OK' ELSE 'Failed' END as status,
           mismatched_id_count as count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- APPLY FIXES
-- =============================================

-- Fix wallet address inconsistencies
SELECT fix_wallet_address_inconsistencies();

-- Fix orphaned media records
SELECT fix_orphaned_media();

-- Create missing identity registry entries
SELECT create_missing_identity_entries();

-- Update vehicle owner_ids
SELECT update_vehicle_owner_ids();

-- Fix wallet address mismatches
SELECT fix_wallet_address_mismatches();

-- =============================================
-- VERIFY FIXES
-- =============================================

-- Verify wallet address consistency
SELECT * FROM check_wallet_address_consistency();

-- Verify orphaned media
SELECT * FROM check_orphaned_media();

-- Verify identity registry integration
SELECT * FROM verify_identity_source_of_truth();

-- End of verification fixes