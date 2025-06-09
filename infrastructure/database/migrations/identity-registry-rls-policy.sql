-- =============================================
-- RLS BYPASS POLICY FOR IDENTITY REGISTRY TABLE
-- =============================================
-- This script adds a policy to allow public access to the identity_registry table
-- for creating new identities.

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can insert identity_registry" ON identity_registry;

-- Create a policy that allows everyone to insert into identity_registry
CREATE POLICY "Public can insert identity_registry"
    ON identity_registry
    FOR INSERT
    WITH CHECK (true);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'identity_registry';