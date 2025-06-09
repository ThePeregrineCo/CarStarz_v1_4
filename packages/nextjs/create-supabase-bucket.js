// Script to create a storage bucket in Supabase
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createBucket() {
  try {
    console.log('Creating vehicle-media bucket...');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('vehicle-media', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'video/mp4']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Bucket already exists. Setting it to public...');
        
        // Update the bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket('vehicle-media', {
          public: true
        });
        
        if (updateError) {
          console.error('Error updating bucket:', updateError);
          return;
        }
        
        console.log('Bucket updated successfully!');
      } else {
        console.error('Error creating bucket:', error);
        return;
      }
    } else {
      console.log('Bucket created successfully!');
    }

    // Create policies for the bucket
    console.log('Creating storage policies...');
    
    // SQL to create policies
    const createPoliciesSQL = `
      -- Create storage policy for vehicle media
      BEGIN;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Vehicle media is publicly accessible" ON storage.objects;
      DROP POLICY IF EXISTS "Users can upload media for their own vehicles" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update their own vehicle media" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete their own vehicle media" ON storage.objects;
      
      -- Create new policies
      CREATE POLICY "Vehicle media is publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'vehicle-media');

      CREATE POLICY "Users can upload media for their own vehicles"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'vehicle-media' AND
          EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE owner_wallet = auth.uid()::text
          )
        );

      CREATE POLICY "Users can update their own vehicle media"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'vehicle-media' AND
          EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE owner_wallet = auth.uid()::text
          )
        );

      CREATE POLICY "Users can delete their own vehicle media"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'vehicle-media' AND
          EXISTS (
            SELECT 1 FROM vehicle_profiles
            WHERE owner_wallet = auth.uid()::text
          )
        );
        
      COMMIT;
    `;
    
    // Execute the SQL to create policies
    const { error: policiesError } = await supabase.rpc('pgSQL', { query: createPoliciesSQL });
    
    if (policiesError) {
      console.error('Error creating policies:', policiesError);
      console.log('You may need to create the policies manually through the Supabase dashboard.');
    } else {
      console.log('Storage policies created successfully!');
    }
    
    console.log('\nBucket setup complete! You can now use it in your application.');
    console.log('Access the bucket in the Supabase dashboard at:');
    console.log(`${supabaseUrl}/project/storage/buckets/vehicle-media`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createBucket();