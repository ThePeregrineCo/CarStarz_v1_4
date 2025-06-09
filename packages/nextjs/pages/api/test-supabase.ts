import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase.from('vehicle_profiles').select('count')
  if (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
  return res.status(200).json({ success: true, data })
} 