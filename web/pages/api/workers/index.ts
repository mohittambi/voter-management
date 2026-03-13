import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, mobile')
      .order('name', { ascending: true });

    if (error) throw error;
    return res.json(data || []);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to fetch workers' });
  }
}
