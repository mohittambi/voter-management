import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { hasPermission } from '../../../lib/rbac';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getSessionUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

async function getUserRole(supabase: ReturnType<typeof getServiceRoleClient>, userId: string): Promise<'admin' | 'office_user' | null> {
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).single();
  return (data?.role as 'admin' | 'office_user') || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    try {
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

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const role = await getUserRole(supabase, user.id);
  if (!hasPermission(role, 'MANAGE_WORKERS')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    const { name, mobile } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    try {
      const { data, error } = await supabase
        .from('workers')
        .insert({ name: String(name).trim(), mobile: mobile ? String(mobile).trim() : null })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Failed to create worker' });
    }
  }

  if (req.method === 'PUT') {
    const { id, name, mobile } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });

    try {
      const { data, error } = await supabase
        .from('workers')
        .update({ name: String(name).trim(), mobile: mobile ? String(mobile).trim() : null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Failed to update worker' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id required' });

    try {
      const { error } = await supabase.from('workers').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Failed to delete worker' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
