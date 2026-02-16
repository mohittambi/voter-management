import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'voter id required' });

  try {
    const supabase = getServiceRoleClient();

    // Fetch master voter
    const { data: master, error: masterErr } = await supabase
      .from('master_voters')
      .select('*')
      .eq('id', id)
      .single();
    if (masterErr) return res.status(404).json({ error: 'voter not found' });

    // Fetch profile with related data
    const { data: profile } = await supabase
      .from('voter_profiles')
      .select(`
        *,
        workers(id, name, mobile, epic_number),
        employees(id, name, employee_id),
        villages(id, name, new_gan, new_gat)
      `)
      .eq('voter_id', id)
      .single();

    return res.json({ master, profile: profile || null });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
