import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleClient } from '../../lib/supabaseClient';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

  const body = req.body || {};
  const voter_id = body.voter_id as string | undefined;
  const hasWorkerField = Object.hasOwn(body, 'worker_id');
  const hasEmployeeField = Object.hasOwn(body, 'employee_id');
  const worker_id = hasWorkerField ? (body.worker_id as string | null) : undefined;
  const employee_id = hasEmployeeField ? (body.employee_id as string | null) : undefined;

  if (!voter_id) return res.status(400).json({ error: 'voter_id required' });
  if (!hasWorkerField && !hasEmployeeField) {
    return res.status(400).json({ error: 'Provide worker_id and/or employee_id' });
  }

  const supabase = getServiceRoleClient();

  const { data: voter } = await supabase.from('master_voters').select('id').eq('id', voter_id).maybeSingle();
  if (!voter) return res.status(400).json({ error: 'Voter not found' });

  if (hasWorkerField && worker_id) {
    const { data: worker } = await supabase.from('workers').select('id').eq('id', worker_id).maybeSingle();
    if (!worker) return res.status(400).json({ error: 'Worker not found' });
  }

  if (hasEmployeeField && employee_id) {
    const { data: employee } = await supabase.from('employees').select('id').eq('id', employee_id).maybeSingle();
    if (!employee) return res.status(400).json({ error: 'Employee not found' });
  }

  const updates: Record<string, any> = {};
  if (hasWorkerField) updates.worker_id = worker_id || null;
  if (hasEmployeeField) updates.employee_id = employee_id || null;

  const { data: existing } = await supabase
    .from('voter_profiles')
    .select('id')
    .eq('voter_id', voter_id)
    .maybeSingle();

  let result: any = null;
  let error: any = null;
  if (existing?.id) {
    const response = await supabase
      .from('voter_profiles')
      .update(updates)
      .eq('voter_id', voter_id)
      .select()
      .single();
    result = response.data;
    error = response.error;
  } else {
    const response = await supabase
      .from('voter_profiles')
      .insert({ voter_id, ...updates })
      .select()
      .single();
    result = response.data;
    error = response.error;
  }

  if (error) return res.status(500).json({ error: error.message });
  return res.json(result);
}
