import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, schema } = req.body;
    const { data, error } = await supabase.from('form_definitions').insert([{ name, schema }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('form_definitions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  return res.status(405).end();
}

