import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { relationshipToMarathi } from '../../../lib/relationshipMarathi';

/**
 * POST body: family_id, new_head_voter_id, former_head_relationship (English: Wife, Son, … =
 * relationship of the **former** head **to** the **new** head once demoted).
 * Optional: current_head_voter_id — must match DB or 409.
 *
 * Keeps the same families.id; updates head_voter_id; former head becomes a family_member.
 * Rejects if new head is already head of another household or member of a different family.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      family_id,
      new_head_voter_id,
      former_head_relationship,
      current_head_voter_id,
      relationship_marathi: bodyMarathi,
    } = req.body as {
      family_id?: string;
      new_head_voter_id?: string;
      former_head_relationship?: string;
      current_head_voter_id?: string;
      relationship_marathi?: string;
    };

    if (!family_id || !new_head_voter_id || !former_head_relationship?.trim()) {
      return res.status(400).json({ error: 'family_id, new_head_voter_id, and former_head_relationship required' });
    }

    const supabase = getServiceRoleClient();

    const { data: family, error: famErr } = await supabase
      .from('families')
      .select('id, head_voter_id')
      .eq('id', family_id)
      .maybeSingle();

    if (famErr) return res.status(500).json({ error: famErr.message });
    if (!family) return res.status(404).json({ error: 'Family not found' });

    const currentHead = family.head_voter_id as string;

    if (current_head_voter_id && current_head_voter_id !== currentHead) {
      return res.status(409).json({ error: 'Family head has changed; refresh and try again' });
    }

    if (new_head_voter_id === currentHead) {
      return res.status(400).json({ error: 'New head must differ from current head' });
    }

    const { data: newHeadRow, error: nhErr } = await supabase
      .from('master_voters')
      .select('id')
      .eq('id', new_head_voter_id)
      .maybeSingle();

    if (nhErr) return res.status(500).json({ error: nhErr.message });
    if (!newHeadRow) return res.status(404).json({ error: 'New head voter not found' });

    const { data: otherHeadFam } = await supabase
      .from('families')
      .select('id')
      .eq('head_voter_id', new_head_voter_id)
      .neq('id', family_id)
      .limit(1)
      .maybeSingle();

    if (otherHeadFam) {
      return res.status(409).json({
        error: 'Selected voter is already head of another household; remove that first or pick someone else',
      });
    }

    const { data: otherFamilyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('voter_id', new_head_voter_id)
      .neq('family_id', family_id)
      .limit(1)
      .maybeSingle();

    if (otherFamilyMember) {
      return res.status(409).json({
        error: 'Selected voter belongs to another family; unlink them there first or pick someone else',
      });
    }

    const relationship = former_head_relationship.trim();
    const relationship_marathi =
      typeof bodyMarathi === 'string' && bodyMarathi.trim()
        ? bodyMarathi.trim()
        : relationshipToMarathi(relationship) ?? null;

    const { error: delPromotedErr } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', family_id)
      .eq('voter_id', new_head_voter_id);

    if (delPromotedErr) return res.status(500).json({ error: delPromotedErr.message });

    const { error: updErr } = await supabase
      .from('families')
      .update({ head_voter_id: new_head_voter_id })
      .eq('id', family_id);

    if (updErr) return res.status(500).json({ error: updErr.message });

    const { data: verifyFam, error: verErr } = await supabase
      .from('families')
      .select('head_voter_id')
      .eq('id', family_id)
      .maybeSingle();

    if (verErr || verifyFam?.head_voter_id !== new_head_voter_id) {
      return res.status(500).json({ error: 'Failed to verify new head assignment' });
    }

    await supabase.from('family_members').delete().eq('family_id', family_id).eq('voter_id', currentHead);

    const { error: insErr } = await supabase.from('family_members').insert([
      {
        family_id,
        voter_id: currentHead,
        relationship,
        relationship_marathi,
      },
    ]);

    if (insErr) return res.status(500).json({ error: insErr.message });

    await supabase.from('audit_logs').insert([
      {
        user_id: null,
        action: 'reassign_family_head',
        details: {
          family_id,
          old_head_voter_id: currentHead,
          new_head_voter_id: new_head_voter_id,
        },
      },
    ]);

    return res.json({ ok: true, family_id, old_head_voter_id: currentHead, new_head_voter_id: new_head_voter_id });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'server error';
    return res.status(500).json({ error: message });
  }
}
