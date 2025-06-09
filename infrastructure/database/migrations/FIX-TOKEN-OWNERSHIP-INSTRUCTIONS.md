# How to Fix the Token Ownership Table in Supabase Dashboard

The verification script showed that the `token_ownership` table is missing from the database. This table is important for tracking NFT ownership and ensuring that the blockchain state is properly reflected in the database.

## Steps to Fix in Supabase Dashboard

1. **Log in to your Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Sign in with your credentials
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" to create a new SQL query

3. **Copy and Paste the Fix Script**
   - Open the file `infrastructure/database/migrations/fix-token-ownership.sql` in your code editor
   - Copy the entire contents of the file
   - Paste it into the SQL Editor in the Supabase Dashboard

4. **Run the Script**
   - Click the "Run" button to execute the SQL script
   - The script will:
     - Check if the `token_ownership` table exists
     - Create the table if it doesn't exist
     - Set up the necessary triggers and relationships
     - Populate the table with existing vehicle data
     - Verify the table was created successfully

5. **Verify the Fix**
   - After running the script, you should see a message indicating the number of records in the `token_ownership` table
   - You can also run the following SQL query to verify:
     ```sql
     SELECT COUNT(*) FROM token_ownership;
     ```

6. **Run the Verification Script Locally**
   - After fixing the issue in Supabase, run the verification script locally to confirm:
     ```bash
     node packages/nextjs/verify-schema-setup.mjs
     ```
   - The script should now show that the `token_ownership` table exists and is accessible

## What the Fix Does

The fix script:

1. Creates the `token_ownership` table if it doesn't exist
2. Sets up indexes for faster lookups
3. Enables Row Level Security (RLS) on the table
4. Creates RLS policies for access control
5. Creates or replaces the `sync_token_ownership` function
6. Creates a trigger to keep the `token_ownership` table in sync with vehicle ownership changes
7. Populates the table with existing vehicle data
8. Verifies the table was created successfully

## Why This Fix Is Important

The `token_ownership` table is crucial for:
- Tracking which identity owns which NFT token
- Ensuring that blockchain state is properly reflected in the database
- Supporting the NFT transfer functionality
- Maintaining data integrity when ownership changes

Without this table, the NFT transfer functionality would not work properly, and there would be inconsistencies between the blockchain state and the database.