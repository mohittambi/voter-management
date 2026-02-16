import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { voter_id } = req.query;
  if (!voter_id) return res.status(400).json({ error: 'voter_id required' });

  try {
    const supabase = getServiceRoleClient();

    // Check if voter is a family head
    const { data: asHead } = await supabase
      .from('families')
      .select('id, head_voter_id')
      .eq('head_voter_id', voter_id)
      .single();

    if (asHead) {
      // Fetch all family members
      const { data: members } = await supabase
        .from('family_members')
        .select(`
          id,
          relationship,
          voter_id,
          master_voters!inner (
            id,
            first_name,
            middle_name,
            surname,
            voter_id
          )
        `)
        .eq('family_id', asHead.id);

      return res.json({
        role: 'head',
        family_id: asHead.id,
        members: members || []
      });
    }

    // Check if voter is a family member
    const { data: asMember } = await supabase
      .from('family_members')
      .select(`
        id,
        relationship,
        family_id,
        families!inner (
          id,
          head_voter_id,
          master_voters!inner (
            id,
            first_name,
            middle_name,
            surname,
            voter_id
          )
        )
      `)
      .eq('voter_id', voter_id)
      .single();

    if (asMember) {
      // Also fetch other members in the same family
      const { data: siblings } = await supabase
        .from('family_members')
        .select(`
          id,
          relationship,
          voter_id,
          master_voters!inner (
            id,
            first_name,
            middle_name,
            surname,
            voter_id
          )
        `)
        .eq('family_id', asMember.family_id)
        .neq('voter_id', voter_id);

      return res.json({
        role: 'member',
        family_id: asMember.family_id,
        head: asMember.families,
        relationship: asMember.relationship,
        siblings: siblings || []
      });
    }

    // Not part of any family
    return res.json({ role: 'none' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
