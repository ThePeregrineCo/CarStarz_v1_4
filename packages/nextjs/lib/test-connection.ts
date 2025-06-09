const { supabase } = require('./supabase')

async function testConnection() {
  try {
    const { data, error } = await supabase.from('vehicle_profiles').select('count')
    if (error) throw error
    console.log('✅ Successfully connected to Supabase!')
    return true
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error)
    return false
  }
}

testConnection() 