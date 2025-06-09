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
