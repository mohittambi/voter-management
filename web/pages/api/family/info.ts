import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { voter_id } = req.query;
  if (!voter_id) return res.status(400).json({ error: 'voter_id required' });

  try {
    const supabase = getServiceRoleClient();

    // Check if voter is a family head (use limit(1): duplicate families.head_voter_id breaks .single() and wrongly returns role "none")
    const { data: headRows, error: headErr } = await supabase
      .from('families')
      .select('id, head_voter_id')
      .eq('head_voter_id', voter_id)
      .order('id', { ascending: true })
      .limit(1);
    if (headErr) console.error('family/info head lookup:', headErr);
    const asHead = headRows?.[0] ?? null;

    if (asHead) {
      // Fetch all family members
      const { data: members } = await supabase
        .from('family_members')
        .select(`
          id,
          relationship,
          relationship_marathi,
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

      /** Flattened member: `id` = master voter uuid (profile links); `family_member_id` = family_members row */
      const flattenedMembers = (members || []).map((m: any) => {
        const mv = m.master_voters;
        const name = [mv?.first_name, mv?.middle_name, mv?.surname].filter(Boolean).join(' ').trim() || mv?.voter_id || '';
        return {
          id: mv?.id || m.voter_id,
          family_member_id: m.id,
          name,
          relationship: m.relationship,
          relationship_marathi: m.relationship_marathi,
        };
      });

      return res.json({
        role: 'head',
        family_id: asHead.id,
        members: flattenedMembers,
      });
    }

    // Check if voter is a family member (limit(1): duplicate family_members rows for same voter break .single())
    const { data: memberRows, error: memberErr } = await supabase
      .from('family_members')
      .select(`
        id,
        relationship,
        relationship_marathi,
        family_id,
        families!inner (
          id,
          head_voter_id
        )
      `)
      .eq('voter_id', voter_id)
      .order('id', { ascending: true })
      .limit(1);
    if (memberErr) console.error('family/info member lookup:', memberErr);
    const asMember = memberRows?.[0] ?? null;

    if (asMember) {
      const fam = Array.isArray(asMember.families) ? asMember.families[0] : asMember.families;
      const headVoterId = (fam as any)?.head_voter_id;
      let flattenedHead: { id: string; name: string } | null = null;
      if (headVoterId) {
        const { data: headVoter } = await supabase
          .from('master_voters')
          .select('id, first_name, middle_name, surname, voter_id')
          .eq('id', headVoterId)
          .single();
        if (headVoter) {
          flattenedHead = {
            id: headVoter.id,
            name: [headVoter.first_name, headVoter.middle_name, headVoter.surname].filter(Boolean).join(' ').trim() || headVoter.voter_id || '',
          };
        }
      }

      const { data: siblings } = await supabase
        .from('family_members')
        .select(`
          id,
          relationship,
          relationship_marathi,
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

      const flattenedSiblings = (siblings || []).map((s: any) => {
        const mv = s.master_voters;
        const name = [mv?.first_name, mv?.middle_name, mv?.surname].filter(Boolean).join(' ').trim() || mv?.voter_id || '';
        return {
          id: mv?.id || s.voter_id,
          family_member_id: s.id,
          name,
          relationship: s.relationship,
          relationship_marathi: s.relationship_marathi,
        };
      });

      return res.json({
        role: 'member',
        family_id: asMember.family_id,
        head: flattenedHead,
        relationship: asMember.relationship,
        relationship_marathi: asMember.relationship_marathi,
        siblings: flattenedSiblings,
      });
    }

    // Not part of any family
    return res.json({ role: 'none' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
