import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('voter_profiles')
      .select(`
        voter_id,
        dob,
        mobile,
        village,
        master_voters!voter_profiles_voter_id_fkey!inner(id, name_english, name_marathi, first_name, middle_name, surname)
      `)
      .not('dob', 'is', null);

    if (error) throw error;

    const rows = (data || []).map((row: any) => {
      const voter = row.master_voters;
      return {
        id: voter?.id,
        name_english: voter?.name_english || [voter?.first_name, voter?.middle_name, voter?.surname].filter(Boolean).join(' '),
        name_marathi: voter?.name_marathi || '',
        village: row.village || '',
        mobile: row.mobile || '',
        dob: row.dob,
      };
    }).filter((r: any) => r.id);

    return res.json(rows);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to fetch birthdays' });
  }
}
