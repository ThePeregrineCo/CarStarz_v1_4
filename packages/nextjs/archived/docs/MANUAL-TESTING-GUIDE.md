# Manual Testing Guide for Profile System Integration

This guide provides step-by-step instructions for manually testing that the profile system works correctly with the existing minting functionality.

## Prerequisites

1. Ensure your `.env` file in the `packages/nextjs` directory contains the necessary Supabase environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install the safe profile system:
   ```bash
   cd packages/nextjs
   chmod +x run-profile-setup-safe.sh
   ./run-profile-setup-safe.sh
   ```

## Test 1: Verify Profile System Setup

1. Start the development server:
   ```bash
   yarn dev
   ```

2. Visit the test profile pages:
   - User profile: http://localhost:3000/user/testuser
   - Business profile: http://localhost:3000/business/{id} (check console output for ID)
   - Club profile: http://localhost:3000/club/{id} (check console output for ID)

3. Verify that all profiles load correctly with their data.

## Test 2: Test Minting Functionality

1. Connect your wallet in the app.

2. Navigate to the minting page (usually at http://localhost:3000/register).

3. Fill out the vehicle details:
   - VIN: A unique VIN (e.g., TEST12345)
   - Name: Test Vehicle
   - Make: Any make
   - Model: Any model
   - Year: Any year
   - Upload an image

4. Submit the form to mint the vehicle.

5. Verify that:
   - You see a success message
   - You're redirected to the vehicle page
   - The vehicle details are displayed correctly

## Test 3: Test Profile-Vehicle Integration

1. Note the token ID of your newly minted vehicle.

2. Visit the business profile page (http://localhost:3000/business/{id}).

3. If there's an "Add Vehicle to Portfolio" button, click it and add your vehicle.
   - If not, you can manually add it through the Supabase dashboard:
     ```sql
     INSERT INTO builder_vehicles (business_id, token_id, work_type, build_description)
     VALUES ('business-id-here', your-token-id, 'Test Work', 'Test description');
     ```

4. Visit the club profile page (http://localhost:3000/club/{id}).

5. If there's an "Add Vehicle to Club" button, click it and add your vehicle.
   - If not, you can manually add it through the Supabase dashboard:
     ```sql
     INSERT INTO club_vehicles (club_id, token_id, added_by)
     VALUES ('club-id-here', your-token-id, 'user-id-here');
     ```

6. Refresh the business and club pages to verify the vehicle appears in their listings.

## Test 4: Verify Vehicle Profile Shows Relationships

1. Visit your vehicle's profile page (http://localhost:3000/vehicle/{tokenId}).

2. Verify that:
   - The vehicle details are correct
   - If implemented, the "Built by" section shows the business
   - If implemented, the "Member of Clubs" section shows the club

## Test 5: Test Wallet Authentication Flow

1. Disconnect your wallet.

2. Connect a different wallet.

3. Try to edit the vehicle profile you created earlier.

4. Verify that:
   - You cannot edit the vehicle (since you're not the owner)
   - The ownership check works correctly

5. Reconnect with the original wallet.

6. Verify you can now edit the vehicle.

## Test 6: Test Multiple Mints

1. Mint another vehicle following the steps in Test 2.

2. Verify that:
   - The minting process works correctly
   - The token ID increments properly
   - The vehicle is correctly associated with your wallet

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors.

2. Check the server logs for backend errors.

3. Verify your Supabase connection:
   ```bash
   node test-supabase-connection.mjs
   ```

4. Check that the database tables were created correctly:
   ```bash
   node check-tables.js
   ```

5. If minting fails, try resetting just the profile tables without affecting the vehicle tables:
   ```sql
   DROP TABLE IF EXISTS social_links, businesses, clubs, services, club_memberships, club_vehicles, club_events, follows, builder_vehicles CASCADE;
   ```

## Database Verification Queries

You can run these queries in the Supabase SQL editor to verify the integration:

### Check Vehicle Profiles
```sql
SELECT * FROM vehicle_profiles ORDER BY token_id DESC LIMIT 5;
```

### Check Business-Vehicle Relationships
```sql
SELECT 
  bv.token_id, 
  b.business_name, 
  bv.work_type, 
  bv.build_description
FROM 
  builder_vehicles bv
JOIN 
  businesses b ON bv.business_id = b.id
ORDER BY 
  bv.created_at DESC
LIMIT 5;
```

### Check Club-Vehicle Relationships
```sql
SELECT 
  cv.token_id, 
  c.club_name, 
  u.username as added_by
FROM 
  club_vehicles cv
JOIN 
  clubs c ON cv.club_id = c.id
LEFT JOIN 
  users u ON cv.added_by = u.id
ORDER BY 
  cv.created_at DESC
LIMIT 5;
```

This manual testing approach will help ensure that the profile system integrates correctly with the existing minting functionality without breaking it.