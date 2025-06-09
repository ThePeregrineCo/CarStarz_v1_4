// Simple script to check Supabase configuration
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found');
console.log('Supabase Anon Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('Supabase Service Role Key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);