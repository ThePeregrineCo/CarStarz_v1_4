-- =============================================
-- IDENTITY REGISTRY INTEGRATION FIXES
-- =============================================
-- This script adds improvements to ensure proper integration between vehicle profiles and identity registry

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