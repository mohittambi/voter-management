import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const VALID_STATUSES = [
  'Document Submitted',
  'Document Shared to Office',
  'Work in Progress',
  'Work Completed',
  'Closed / Delivered',
];

async function getSessionUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    const { data: sr, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        master_voters(id, voter_id, name_english, name_marathi, first_name, surname),
        service_types(id, name),
        voter_profiles!left(mobile, village),
        service_request_status_logs(id, status, changed_by, changed_at)
      `)
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Not found' });
    return res.json(sr);
  }

  if (req.method === 'PATCH') {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { data: updated, error } = await supabase
      .from('service_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Insert status change log
    await supabase.from('service_request_status_logs').insert({
      request_id: id,
      status,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
    });

    return res.json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
