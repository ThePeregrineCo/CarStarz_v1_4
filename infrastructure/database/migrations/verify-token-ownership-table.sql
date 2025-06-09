-- Verify if token_ownership table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'token_ownership'
) as token_ownership_exists;

-- Check table permissions
SELECT 
  table_schema, 
  table_name, 
  privilege_type
FROM 
  information_schema.table_privileges
WHERE 
  table_name = 'token_ownership';

-- Check if RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM
  pg_tables
WHERE
  tablename = 'token_ownership';

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM
  pg_policies
WHERE
  tablename = 'token_ownership';

-- Try to create the table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'token_ownership'
  ) THEN
    -- Create token_ownership table
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
    
    -- Create indexes for token ownership lookups
    CREATE INDEX idx_token_ownership_identity_id ON token_ownership(identity_id);
    CREATE INDEX idx_token_ownership_vehicle_id ON token_ownership(vehicle_id);
    
    -- Enable Row Level Security
    ALTER TABLE token_ownership ENABLE ROW LEVEL SECURITY;
    
    -- Token ownership policies
    CREATE POLICY "Token ownership records are viewable by everyone"
        ON token_ownership FOR SELECT
        USING (true);
    
    RAISE NOTICE 'Created token_ownership table';
  ELSE
    RAISE NOTICE 'token_ownership table already exists';
  END IF;
END $$;

-- Verify again if token_ownership table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'token_ownership'
) as token_ownership_exists_after_check;