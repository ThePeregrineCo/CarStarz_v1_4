#!/bin/bash

# Make sure we're in the nextjs directory
cd "$(dirname "$0")"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Error: .env.local file not found!"
  echo "Please create a .env.local file with your Supabase credentials:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
  echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
  exit 1
fi

# Export environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Neither NEXT_PUBLIC_SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set in .env.local"
  exit 1
fi

# Create the setup script
cat > setup-profile-storage.mjs << 'EOL'
import { createClient } from '@supabase/supabase-js';

async function setupProfileStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure environment variables are exported.');
    process.exit(1);
  }
  
  console.log('Using Supabase URL:', supabaseUrl);
  console.log('Using Supabase Key:', supabaseKey.substring(0, 5) + '...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Create the profile-images bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    const profileBucketExists = buckets.some(bucket => bucket.name === 'profile-images');
    
    if (!profileBucketExists) {
      console.log('Creating profile-images bucket...');
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('profile-images', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
      
      if (createBucketError) {
        throw createBucketError;
      }
      
      console.log('✅ profile-images bucket created successfully');
    } else {
      console.log('✅ profile-images bucket already exists');
    }
    
    // Update bucket to be public
    const { error: updateBucketError } = await supabase
      .storage
      .updateBucket('profile-images', {
        public: true
      });
    
    if (updateBucketError) {
      throw updateBucketError;
    }
    
    console.log('✅ profile-images bucket set to public');
    
    console.log('Storage setup completed successfully!');
  } catch (error) {
    console.error('Error setting up storage:', error);
    process.exit(1);
  }
}

setupProfileStorage();
EOL

# Make the script executable
chmod +x setup-profile-storage.mjs

# Check if @supabase/supabase-js is installed
if ! grep -q "@supabase/supabase-js" package.json; then
  echo "Installing @supabase/supabase-js..."
  npm install @supabase/supabase-js
fi

# Run the script
echo "Setting up profile storage..."
node setup-profile-storage.mjs

# Check if the script was successful
if [ $? -eq 0 ]; then
  echo "Setup completed successfully!"
else
  echo "Error: Setup failed!"
  exit 1
fi