import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { head_voter_id, member_voter_id, relationship } = req.body;
    if (!head_voter_id || !member_voter_id) return res.status(400).json({ error: 'missing ids' });
    const supabase = getServiceRoleClient();

    // Ensure member isn't already in another family
    const { data: existing } = await supabase.from('family_members').select('*').eq('voter_id', member_voter_id).limit(1);
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'member already linked to a family' });
    }

    // Find or create family for head
    const { data: family } = await supabase.from('families').select('*').eq('head_voter_id', head_voter_id).limit(1).single();
    let familyId = family?.id;
    if (!familyId) {
      const { data: newFam } = await supabase.from('families').insert([{ head_voter_id }]).select().single();
      familyId = newFam.id;
    }

    // Insert member
    const { data: member, error } = await supabase.from('family_members').insert([{ family_id: familyId, voter_id: member_voter_id, relationship }]).select().single();
    if (error) return res.status(500).json({ error: error.message });

    await supabase.from('audit_logs').insert([{ user_id: null, action: 'link_family_member', details: { family_id: familyId, member_voter_id } }]);

    return res.json(member);
  } catch (err:any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}

