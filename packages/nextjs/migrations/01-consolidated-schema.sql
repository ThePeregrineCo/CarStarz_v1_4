-- Consolidated Schema Migration
BEGIN;

-- Step 1: Add missing constraints to identity_registry
ALTER TABLE identity_registry 
ADD CONSTRAINT identity_registry_normalized_wallet_key UNIQUE (normalized_wallet);

-- Step 2: Create materialized view for vehicle cards
CREATE MATERIALIZED VIEW IF NOT EXISTS vehicle_cards AS
SELECT 
  vp.id,
  vp.token_id,
  vp.make,
  vp.model,
  vp.year,
  vp.name,
  vp.owner_wallet,
  ir.id as owner_id,
  ir.username as owner_username,
  ir.display_name as owner_display_name,
  ir.profile_image_url as owner_profile_image,
  (SELECT url FROM vehicle_media 
   WHERE vehicle_id = vp.id AND is_featured = true 
   LIMIT 1) as featured_image_url
FROM 
  vehicle_profiles vp
LEFT JOIN 
  identity_registry ir ON vp.identity_id = ir.id;

-- Step 3: Create indexes for the materialized view
CREATE INDEX IF NOT EXISTS idx_vehicle_cards_token_id ON vehicle_cards(token_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_cards_owner_wallet ON vehicle_cards(owner_wallet);

-- Step 4: Create refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_vehicle_cards()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vehicle_cards;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to refresh the view
DROP TRIGGER IF EXISTS refresh_vehicle_cards_trigger ON vehicle_profiles;
CREATE TRIGGER refresh_vehicle_cards_trigger
AFTER INSERT OR UPDATE OR DELETE ON vehicle_profiles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_vehicle_cards();

-- Step 6: Create blockchain events table for transfer event processing
CREATE TABLE IF NOT EXISTS blockchain_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  from_address TEXT,
  to_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Step 7: Create indexes for blockchain events
CREATE INDEX IF NOT EXISTS idx_blockchain_events_status ON blockchain_events(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_token_id ON blockchain_events(token_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_created_at ON blockchain_events(created_at);

-- Step 8: Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_make_model_year ON vehicle_profiles(make, model, year);
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_owner_wallet ON vehicle_profiles(owner_wallet);

COMMIT;
