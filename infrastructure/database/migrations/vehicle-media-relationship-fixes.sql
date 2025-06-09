-- =============================================
-- VEHICLE-MEDIA RELATIONSHIP FIXES
-- =============================================
-- This script adds improvements to ensure proper vehicle-media relationships

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