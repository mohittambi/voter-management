import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { voter_id, dob, mobile, aadhaar_masked, email, address_marathi, address_english, social_ids } = req.body;
    if (!voter_id) return res.status(400).json({ error: 'voter_id required' });
    const supabase = getServiceRoleClient();

    // upsert into voter_profiles by voter_id
    const { data, error } = await supabase
      .from('voter_profiles')
      .upsert(
        [{
          voter_id,
          dob: dob || null,
          mobile: mobile || null,
          aadhaar_masked: aadhaar_masked || null,
          email: email || null,
          address_marathi: address_marathi || null,
          address_english: address_english || null,
          social_ids: social_ids || null,
        }],
        { onConflict: 'voter_id' }
      )
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    // insert audit log
    await supabase.from('audit_logs').insert([{ user_id: null, action: 'update_profile', details: { voter_id }, }]);

    return res.json(data);
  } catch (err:any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

