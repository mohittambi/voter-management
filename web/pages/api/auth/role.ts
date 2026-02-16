import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
      .single();

    if (error || !data) {
      // No role found, default to office_user
      return res.json({ role: 'office_user' });
    }

    return res.json({ role: data.role });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
