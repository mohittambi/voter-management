import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = getServiceRoleClient();
    const view = req.query.view as string | undefined;

    if (view === 'mapping') {
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('id, name, mobile')
        .order('name', { ascending: true });
      if (workersError) throw workersError;

      const { data: assignedRows, error: assignedError } = await supabase
        .from('voter_profiles')
        .select(`
          worker_id,
          voter_id,
          mobile,
          village,
          master_voters!voter_profiles_voter_id_fkey(
            id,
            voter_id,
            name_english,
            first_name,
            surname
          )
        `)
        .not('worker_id', 'is', null);
      if (assignedError) throw assignedError;

      const grouped = new Map<string, any[]>();
      (assignedRows || []).forEach((row: any) => {
        const key = row.worker_id;
        if (!key) return;
        const master = Array.isArray(row.master_voters) ? row.master_voters[0] : row.master_voters;
        const voter = {
          id: master?.id || row.voter_id,
          voter_id: master?.voter_id || '',
          name: master?.name_english || `${master?.first_name || ''} ${master?.surname || ''}`.trim(),
          mobile: row.mobile || null,
          village: row.village || null,
        };
        const list = grouped.get(key) || [];
        list.push(voter);
        grouped.set(key, list);
      });

      const mapping = (workers || []).map((worker: any) => {
        const voters = grouped.get(worker.id) || [];
        return {
          id: worker.id,
          name: worker.name,
          mobile: worker.mobile,
          assigned_count: voters.length,
          voters,
        };
      });

      return res.json(mapping);
    }

    const { data, error } = await supabase
      .from('workers')
      .select('id, name, mobile')
      .order('name', { ascending: true });

    if (error) throw error;
    return res.json(data || []);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to fetch workers' });
  }
}
