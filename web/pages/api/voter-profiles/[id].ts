import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getSessionUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id: voterId } = req.query as { id: string };
  if (!voterId) return res.status(400).json({ error: 'id (voter_id) required' });

  const { data_validated } = req.body;
  if (typeof data_validated !== 'boolean') return res.status(400).json({ error: 'data_validated boolean required' });

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('voter_profiles')
    .update({ data_validated, updated_at: new Date().toISOString() })
    .eq('voter_id', voterId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}
