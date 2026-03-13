import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { member_voter_id, new_head_voter_id, relationship } = req.body;
    if (!member_voter_id || !new_head_voter_id || !relationship) {
      return res.status(400).json({ error: 'member_voter_id, new_head_voter_id, and relationship are required' });
    }

    const supabase = getServiceRoleClient();

    // Check: member cannot move to own family (member === new head)
    if (member_voter_id === new_head_voter_id) {
      return res.status(400).json({ error: 'Cannot move to own family' });
    }

    // Fetch current membership
    const { data: currentMember, error: fetchErr } = await supabase
      .from('family_members')
      .select('id, family_id, voter_id')
      .eq('voter_id', member_voter_id)
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    // Check: member must exist in a family
    if (!currentMember) {
      return res.status(400).json({ error: 'Voter is not in any family' });
    }

    // Fetch current family to get head_voter_id
    const { data: currentFamily, error: famErr } = await supabase
      .from('families')
      .select('head_voter_id')
      .eq('id', currentMember.family_id)
      .single();

    if (famErr || !currentFamily) throw new Error('Family not found');

    const currentHeadId = currentFamily.head_voter_id;

    // Check: member must not be a family head
    if (currentHeadId === member_voter_id) {
      return res.status(400).json({ error: 'Family head cannot be moved. Create a new family or reassign head first.' });
    }

    // Check: new head must differ from current head (not same family)
    if (currentHeadId === new_head_voter_id) {
      return res.status(400).json({ error: 'Already in this family' });
    }

    // Check: new_head_voter_id must exist in master_voters
    const { data: newHeadVoter, error: voterErr } = await supabase
      .from('master_voters')
      .select('id')
      .eq('id', new_head_voter_id)
      .maybeSingle();

    if (voterErr || !newHeadVoter) {
      return res.status(404).json({ error: 'New family head not found' });
    }

    const fromFamilyId = currentMember.family_id;

    // Delete from current family
    const { error: deleteErr } = await supabase
      .from('family_members')
      .delete()
      .eq('voter_id', member_voter_id);

    if (deleteErr) throw deleteErr;

    // Find or create family for new head
    let toFamilyId: string;
    const { data: existingFamily } = await supabase
      .from('families')
      .select('id')
      .eq('head_voter_id', new_head_voter_id)
      .limit(1)
      .maybeSingle();

    if (existingFamily?.id) {
      toFamilyId = existingFamily.id;
    } else {
      const { data: newFam, error: insertFamErr } = await supabase
        .from('families')
        .insert([{ head_voter_id: new_head_voter_id }])
        .select('id')
        .single();
      if (insertFamErr) throw insertFamErr;
      toFamilyId = newFam.id;
    }

    // Insert into new family
    const { data: member, error: insertErr } = await supabase
      .from('family_members')
      .insert([{ family_id: toFamilyId, voter_id: member_voter_id, relationship }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    await supabase.from('audit_logs').insert([{
      user_id: null,
      action: 'move_family_member',
      details: { from_family_id: fromFamilyId, to_family_id: toFamilyId, member_voter_id },
    }]);

    return res.json(member);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
