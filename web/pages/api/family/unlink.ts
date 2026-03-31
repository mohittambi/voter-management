import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { family_id, member_voter_id } = req.body as { family_id?: string; member_voter_id?: string };
    if (!family_id || !member_voter_id) {
      return res.status(400).json({ error: 'family_id and member_voter_id required' });
    }

    const supabase = getServiceRoleClient();

    const { data: fam, error: famErr } = await supabase
      .from('families')
      .select('id, head_voter_id')
      .eq('id', family_id)
      .maybeSingle();

    if (famErr) return res.status(500).json({ error: famErr.message });
    if (!fam) return res.status(404).json({ error: 'Family not found' });

    if (fam.head_voter_id === member_voter_id) {
      return res.status(400).json({ error: 'Cannot remove family head from family this way' });
    }

    const { data: row, error: selErr } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', family_id)
      .eq('voter_id', member_voter_id)
      .maybeSingle();

    if (selErr) return res.status(500).json({ error: selErr.message });
    if (!row) return res.status(404).json({ error: 'Member not in this family' });

    const { error: delErr } = await supabase.from('family_members').delete().eq('id', row.id);
    if (delErr) return res.status(500).json({ error: delErr.message });

    await supabase.from('audit_logs').insert([
      { user_id: null, action: 'unlink_family_member', details: { family_id, member_voter_id } },
    ]);

    return res.json({ ok: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : 'server error';
    return res.status(500).json({ error: message });
  }
}
