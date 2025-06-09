-- Migration script to add identity_id column to vehicle_profiles table
-- This creates a foreign key relationship between vehicle_profiles and identity_registry

-- Step 1: Add identity_id column to vehicle_profiles
ALTER TABLE vehicle_profiles 
ADD COLUMN identity_id UUID REFERENCES identity_registry(id);

-- Step 2: Create index for faster lookups
CREATE INDEX idx_vehicle_profiles_identity_id ON vehicle_profiles(identity_id);

-- Step 3: Update existing records to set identity_id based on owner_wallet
UPDATE vehicle_profiles
SET identity_id = ir.id
FROM identity_registry ir
WHERE LOWER(vehicle_profiles.owner_wallet) = ir.normalized_wallet;

-- Step 4: Create a trigger function to keep identity_id in sync with owner_wallet
CREATE OR REPLACE FUNCTION update_vehicle_identity_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the identity_id for the new owner_wallet
  SELECT id INTO NEW.identity_id
  FROM identity_registry
  WHERE normalized_wallet = LOWER(NEW.owner_wallet);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a trigger to automatically update identity_id when owner_wallet changes
CREATE TRIGGER before_vehicle_insert_update
BEFORE INSERT OR UPDATE ON vehicle_profiles
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_identity_id();

-- Step 6: Create a view for efficient queries
CREATE OR REPLACE VIEW vehicle_profiles_with_owner AS
SELECT 
  vp.*,
  ir.id as owner_id,
  ir.wallet_address as owner_wallet_address,
  ir.normalized_wallet as owner_normalized_wallet,
  ir.username as owner_username,
  ir.display_name as owner_display_name,
  ir.profile_image_url as owner_profile_image
FROM 
  vehicle_profiles vp
LEFT JOIN 
  identity_registry ir ON vp.identity_id = ir.id;