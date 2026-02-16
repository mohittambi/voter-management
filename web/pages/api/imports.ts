import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('imports')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
