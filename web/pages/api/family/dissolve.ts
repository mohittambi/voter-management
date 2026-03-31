import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

/**
 * POST: remove this household entirely — deletes all family_members and the families row.
 * Body: family_id (uuid), head_voter_id (uuid) — must match families.head_voter_id (caller is current head).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { family_id, head_voter_id } = req.body as { family_id?: string; head_voter_id?: string };
    if (!family_id || !head_voter_id) {
      return res.status(400).json({ error: 'family_id and head_voter_id required' });
    }

    const supabase = getServiceRoleClient();

    const { data: fam, error: famErr } = await supabase
      .from('families')
      .select('id, head_voter_id')
      .eq('id', family_id)
      .maybeSingle();

    if (famErr) return res.status(500).json({ error: famErr.message });
    if (!fam) return res.status(404).json({ error: 'Family not found' });

    if (fam.head_voter_id !== head_voter_id) {
      return res.status(403).json({ error: 'Only the stored household lead can dissolve this household' });
    }

    const { error: delMemErr } = await supabase.from('family_members').delete().eq('family_id', family_id);
    if (delMemErr) return res.status(500).json({ error: delMemErr.message });

    const { error: delFamErr } = await supabase.from('families').delete().eq('id', family_id);
    if (delFamErr) return res.status(500).json({ error: delFamErr.message });

    await supabase.from('audit_logs').insert([
      {
        user_id: null,
        action: 'dissolve_family',
        details: { family_id, head_voter_id },
      },
    ]);

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'server error';
    return res.status(500).json({ error: message });
  }
}
