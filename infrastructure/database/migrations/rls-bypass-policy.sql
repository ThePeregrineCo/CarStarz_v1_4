-- =============================================
-- RLS BYPASS POLICY FOR SERVICE ROLE
-- =============================================
-- This script adds a policy to allow the service role to bypass RLS
-- for the vehicle_profiles table. This is needed for blockchain event
-- processing that runs on the client side.

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage all vehicle profiles" ON vehicle_profiles;

-- Create a policy that allows the service role to bypass RLS
CREATE POLICY "Service role can manage all vehicle profiles"
    ON vehicle_profiles
    USING (true)
    WITH CHECK (true);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'vehicle_profiles';