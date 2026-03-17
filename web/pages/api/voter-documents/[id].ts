import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = 'voter_bucket';

async function getSessionUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: 'id is required' });

  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    const { data: doc, error } = await supabase
      .from('voter_documents')
      .select('id, voter_id, document_type, storage_path, file_name, created_at')
      .eq('id', id)
      .single();
    if (error || !doc) return res.status(404).json({ error: 'Not found' });
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 3600);
    if (!signed?.signedUrl) return res.status(404).json({ error: 'File not found in storage' });
    return res.json({ url: signed.signedUrl, file_name: doc.file_name });
  }

  if (req.method === 'DELETE') {
    const { data: doc, error: fetchErr } = await supabase
      .from('voter_documents')
      .select('storage_path')
      .eq('id', id)
      .single();
    if (fetchErr || !doc) return res.status(404).json({ error: 'Not found' });
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    const { error: delErr } = await supabase.from('voter_documents').delete().eq('id', id);
    if (delErr) return res.status(500).json({ error: delErr.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
