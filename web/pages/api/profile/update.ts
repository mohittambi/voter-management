import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const {
      voter_id,
      dob,
      mobile,
      mobile_secondary,
      aadhaar_masked,
      email,
      address_marathi,
      address_english,
      social_ids,
      education,
      occupation,
      caste_category,
      ration_card_type,
      anniversary_date,
      worker_id,
      employee_id,
    } = req.body;
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
          mobile_secondary: mobile_secondary || null,
          aadhaar_masked: aadhaar_masked || null,
          email: email || null,
          address_marathi: address_marathi || null,
          address_english: address_english || null,
          social_ids: social_ids || null,
          education: education?.trim() || null,
          occupation: occupation?.trim() || null,
          caste_category: caste_category?.trim() || null,
          ration_card_type: ration_card_type?.trim() || null,
          anniversary_date: anniversary_date || null,
          worker_id: worker_id || null,
          employee_id: employee_id || null,
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

