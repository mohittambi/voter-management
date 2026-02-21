import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      first_name,
      middle_name,
      surname,
      voter_id,
      name_marathi,
      name_english,
      booth_number,
      serial_number,
      caste,
      age,
      gender,
      assembly_constituency,
      dob,
      mobile,
      mobile_secondary,
      email,
      aadhaar_masked,
      address_marathi,
      address_english,
      village,
    } = req.body;

    if (!voter_id || typeof voter_id !== 'string' || !voter_id.trim()) {
      return res.status(400).json({ error: 'Voter ID is required' });
    }

    const supabase = getServiceRoleClient();

    const { data: existing } = await supabase
      .from('master_voters')
      .select('id')
      .eq('voter_id', voter_id.trim())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Voter ID already exists. Please use a unique Voter ID.' });
    }

    const masterPayload: Record<string, any> = {
      first_name: first_name?.trim() || null,
      middle_name: middle_name?.trim() || null,
      surname: surname?.trim() || null,
      voter_id: voter_id.trim(),
      name_marathi: name_marathi?.trim() || null,
      name_english: name_english?.trim() || null,
      booth_number: booth_number ? parseInt(booth_number) : null,
      serial_number: serial_number ? parseInt(serial_number) : null,
      caste: caste?.trim() || null,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      assembly_constituency: assembly_constituency?.trim() || null,
    };

    const { data: master, error: masterErr } = await supabase
      .from('master_voters')
      .insert(masterPayload)
      .select()
      .single();

    if (masterErr) return res.status(500).json({ error: masterErr.message });

    const profilePayload: Record<string, any> = {
      voter_id: master.id,
      dob: dob || null,
      mobile: mobile?.trim() || null,
      mobile_secondary: mobile_secondary?.trim() || null,
      email: email?.trim() || null,
      aadhaar_masked: aadhaar_masked?.trim() || null,
      address_marathi: address_marathi?.trim() || null,
      address_english: address_english?.trim() || null,
      village: village?.trim() || null,
    };

    await supabase.from('voter_profiles').upsert(profilePayload, { onConflict: 'voter_id' });

    return res.status(201).json({
      ...master,
      id: master.id,
      voter_id: master.voter_id,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to create voter' });
  }
}
