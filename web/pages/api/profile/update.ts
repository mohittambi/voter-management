import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

function trimOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

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
      first_name,
      middle_name,
      surname,
      name_english,
      name_marathi,
      first_name_marathi,
      surname_marathi,
      epic_number,
    } = req.body;
    if (!voter_id) return res.status(400).json({ error: 'voter_id required' });
    const supabase = getServiceRoleClient();
    const normalizedWorkerId = worker_id || null;
    const normalizedEmployeeId = employee_id || null;

    if (normalizedWorkerId) {
      const { data: worker, error: workerErr } = await supabase
        .from('workers')
        .select('id')
        .eq('id', normalizedWorkerId)
        .maybeSingle();
      if (workerErr) return res.status(500).json({ error: workerErr.message });
      if (!worker) return res.status(400).json({ error: 'Invalid worker_id' });
    }

    if (normalizedEmployeeId) {
      const { data: employee, error: employeeErr } = await supabase
        .from('employees')
        .select('id')
        .eq('id', normalizedEmployeeId)
        .maybeSingle();
      if (employeeErr) return res.status(500).json({ error: employeeErr.message });
      if (!employee) return res.status(400).json({ error: 'Invalid employee_id' });
    }

    const patch: Record<string, string | null> = {};
    if (first_name !== undefined) patch.first_name = trimOrNull(first_name);
    if (middle_name !== undefined) patch.middle_name = trimOrNull(middle_name);
    if (surname !== undefined) patch.surname = trimOrNull(surname);
    if (name_english !== undefined) patch.name_english = trimOrNull(name_english);
    if (name_marathi !== undefined) patch.name_marathi = trimOrNull(name_marathi);
    if (first_name_marathi !== undefined) patch.first_name_marathi = trimOrNull(first_name_marathi);
    if (surname_marathi !== undefined) patch.surname_marathi = trimOrNull(surname_marathi);

    if (epic_number !== undefined) {
      const epic = trimOrNull(epic_number);
      if (!epic) return res.status(400).json({ error: 'EPIC / Voter ID cannot be empty' });
      const normEpic = epic.toUpperCase();
      const { data: clash, error: clashErr } = await supabase
        .from('master_voters')
        .select('id')
        .eq('voter_id', normEpic)
        .neq('id', voter_id)
        .maybeSingle();
      if (clashErr) return res.status(500).json({ error: clashErr.message });
      if (clash) return res.status(400).json({ error: 'This Voter ID (EPIC) is already in use' });
      patch.voter_id = normEpic;
    }

    let masterRow: Record<string, unknown> | null = null;
    if (Object.keys(patch).length > 0) {
      const { data: updatedMaster, error: mErr } = await supabase
        .from('master_voters')
        .update(patch)
        .eq('id', voter_id)
        .select()
        .single();
      if (mErr) return res.status(500).json({ error: mErr.message });
      masterRow = updatedMaster as Record<string, unknown>;
    }

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
          worker_id: normalizedWorkerId,
          employee_id: normalizedEmployeeId,
        }],
        { onConflict: 'voter_id' }
      )
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    // insert audit log
    await supabase.from('audit_logs').insert([{ user_id: null, action: 'update_profile', details: { voter_id }, }]);

    return res.json({ profile: data, master: masterRow });
  } catch (err:any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

