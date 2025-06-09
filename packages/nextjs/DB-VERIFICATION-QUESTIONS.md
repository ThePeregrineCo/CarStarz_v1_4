# CarStarz Database Verification Questions

These questions can be used to verify that the database schema has been correctly set up and that the relationships between tables are working as expected.

## 1. Vehicle Ownership Verification

**Question:** Can a user view and update their own vehicle profiles but not others?

**SQL to Verify:**
```sql
-- As a specific user (replace with actual wallet address)
SELECT * FROM vehicle_profiles 
WHERE owner_wallet = 'user_wallet_address';

-- Try to update a vehicle owned by this user
UPDATE vehicle_profiles 
SET description = 'Updated description' 
WHERE owner_wallet = 'user_wallet_address' 
RETURNING id, description;

-- Try to update a vehicle not owned by this user (should fail)
UPDATE vehicle_profiles 
SET description = 'Unauthorized update' 
WHERE owner_wallet != 'user_wallet_address' 
RETURNING id, description;
```

## 2. Vehicle-Media Relationship

**Question:** Are all media items correctly associated with their respective vehicles, and can they be retrieved efficiently?

**SQL to Verify:**
```sql
-- Get all media for a specific vehicle
SELECT v.make, v.model, v.year, m.url, m.type, m.caption
FROM vehicle_profiles v
JOIN vehicle_media m ON v.id = m.vehicle_id
WHERE v.token_id = 123;

-- Check if the index is being used
EXPLAIN ANALYZE
SELECT * FROM vehicle_media
WHERE vehicle_id = 'specific_vehicle_uuid';
```

## 3. Identity Registry Integration

**Question:** Are vehicle profiles correctly linked to identity registry entries?

**SQL to Verify:**
```sql
-- Check for vehicles with missing identity links
SELECT vp.id, vp.token_id, vp.owner_wallet, ir.id as identity_id, ir.wallet_address
FROM vehicle_profiles vp
LEFT JOIN identity_registry ir ON vp.owner_wallet = ir.wallet_address
WHERE ir.id IS NULL;

-- Check for mismatched wallet addresses
SELECT vp.id, vp.token_id, vp.owner_wallet, ir.wallet_address
FROM vehicle_profiles vp
JOIN identity_registry ir ON vp.owner_id = ir.id
WHERE LOWER(vp.owner_wallet) != LOWER(ir.wallet_address);
```

## 4. Row-Level Security Effectiveness

**Question:** Is row-level security correctly preventing unauthorized access to vehicle data?

**SQL to Verify:**
```sql
-- Test as anonymous user
-- Should only return public data
SELECT * FROM vehicle_profiles LIMIT 5;

-- Test as authenticated user
-- Should allow updates to own vehicles but not others
UPDATE vehicle_profiles 
SET description = 'Test update' 
WHERE id = 'vehicle_uuid' 
RETURNING id, description;
```

## 5. Storage Bucket Configuration

**Question:** Is the storage bucket for vehicle media correctly configured with appropriate permissions?

**SQL to Verify:**
```sql
-- Check if the bucket exists
SELECT * FROM storage.buckets 
WHERE id = 'vehicle-media';

-- Check storage policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

## 6. Vehicle Modifications Relationship

**Question:** Can users add, update, and delete modifications for their own vehicles only?

**SQL to Verify:**
```sql
-- Get all modifications for a specific vehicle
SELECT vp.make, vp.model, vm.name, vm.description, vm.category
FROM vehicle_profiles vp
JOIN vehicle_modifications vm ON vp.id = vm.vehicle_id
WHERE vp.token_id = 123;

-- Try to add a modification to a vehicle owned by the user
INSERT INTO vehicle_modifications (vehicle_id, name, description, category)
VALUES ('vehicle_uuid', 'New Exhaust', 'High-performance exhaust system', 'Performance')
RETURNING id, name;

-- Try to add a modification to a vehicle not owned by the user (should fail)
INSERT INTO vehicle_modifications (vehicle_id, name, description, category)
VALUES ('other_vehicle_uuid', 'New Exhaust', 'High-performance exhaust system', 'Performance')
RETURNING id, name;
```

## 7. User Collections Functionality

**Question:** Can users create and manage their collections (starred vehicles) correctly?

**SQL to Verify:**
```sql
-- Get all vehicles in a user's collection
SELECT uc.id, vp.token_id, vp.make, vp.model, vp.year
FROM user_collections uc
JOIN vehicle_profiles vp ON uc.token_id = vp.token_id
WHERE uc.user_wallet = 'user_wallet_address';

-- Add a vehicle to a collection
INSERT INTO user_collections (user_wallet, token_id)
VALUES ('user_wallet_address', 123)
RETURNING id, token_id;

-- Remove a vehicle from a collection
DELETE FROM user_collections
WHERE user_wallet = 'user_wallet_address' AND token_id = 123
RETURNING id, token_id;
```

## 8. Trigger Functionality

**Question:** Are the updated_at timestamps being automatically updated when records are modified?

**SQL to Verify:**
```sql
-- Update a record and check if updated_at is changed
UPDATE vehicle_profiles
SET description = 'Testing triggers'
WHERE token_id = 123
RETURNING id, description, created_at, updated_at;

-- Check if there's a time difference
SELECT id, description, 
       created_at, 
       updated_at, 
       (updated_at - created_at) as time_diff
FROM vehicle_profiles
WHERE token_id = 123;
```

## 9. Foreign Key Constraints

**Question:** Are foreign key constraints properly enforcing data integrity?

**SQL to Verify:**
```sql
-- Try to insert a record with an invalid foreign key (should fail)
INSERT INTO vehicle_media (vehicle_id, url, type)
VALUES ('non_existent_uuid', 'https://example.com/image.jpg', 'image')
RETURNING id;

-- Try to delete a vehicle with associated records (should cascade)
DELETE FROM vehicle_profiles
WHERE token_id = 123
RETURNING id;

-- Check if associated records were deleted
SELECT COUNT(*) FROM vehicle_media WHERE vehicle_id = 'deleted_vehicle_uuid';
SELECT COUNT(*) FROM vehicle_modifications WHERE vehicle_id = 'deleted_vehicle_uuid';
```

## 10. Identity Registry and Social Links

**Question:** Are social links correctly associated with identity registry entries?

**SQL to Verify:**
```sql
-- Get all social links for a specific identity
SELECT ir.wallet_address, ir.username, sl.platform, sl.url, sl.display_name
FROM identity_registry ir
JOIN social_links sl ON ir.wallet_address = sl.wallet_address
WHERE ir.wallet_address = 'user_wallet_address';

-- Add a social link to an identity
INSERT INTO social_links (wallet_address, platform, url, display_name)
VALUES ('user_wallet_address', 'twitter', 'https://twitter.com/username', 'Username')
RETURNING id, platform;

-- Update a social link
UPDATE social_links
SET url = 'https://twitter.com/new_username'
WHERE wallet_address = 'user_wallet_address' AND platform = 'twitter'
RETURNING id, platform, url;
```

These verification questions and SQL queries will help ensure that the database schema is correctly set up and that the relationships between tables are working as expected. They cover key aspects of the application's data model, including ownership, relationships, security, and data integrity.