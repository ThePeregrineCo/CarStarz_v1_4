# SQL for Creating Identity Registry in Supabase Dashboard

You can run the following SQL in the Supabase dashboard SQL Editor to create the identity registry table:

```sql
-- Create the identity_registry table if it doesn't exist
CREATE TABLE IF NOT EXISTS identity_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  normalized_wallet TEXT NOT NULL,
  user_id UUID,
  ens_name TEXT,
  did TEXT,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_identity_registry_wallet_address ON identity_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);
CREATE INDEX IF NOT EXISTS idx_identity_registry_user_id ON identity_registry(user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS update_identity_registry_timestamp ON identity_registry;
CREATE TRIGGER update_identity_registry_timestamp
BEFORE UPDATE ON identity_registry
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

## Steps to Run SQL in Supabase Dashboard

1. Log in to your Supabase account
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Paste the SQL above
6. Click "Run" to execute the SQL

After creating the table, you can use the identity service in your application. The identity service will automatically register wallet addresses in the identity registry when users authenticate.