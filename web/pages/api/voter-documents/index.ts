import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

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

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    const voter_id = req.query.voter_id as string;
    if (!voter_id) return res.status(400).json({ error: 'voter_id is required' });
    const { data, error } = await supabase
      .from('voter_documents')
      .select('id, voter_id, document_type, storage_path, file_name, created_at')
      .eq('voter_id', voter_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  }

  if (req.method === 'POST') {
    try {
      const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
      const [fields, files] = await form.parse(req);
      const voter_id = Array.isArray(fields.voter_id) ? fields.voter_id[0] : fields.voter_id;
      const document_type = (Array.isArray(fields.document_type) ? fields.document_type[0] : fields.document_type) || 'Other';
      const file = files.file?.[0];
      if (!voter_id) return res.status(400).json({ error: 'voter_id is required' });
      if (!file) return res.status(400).json({ error: 'file is required' });

      const filename = file.originalFilename || file.newFilename || 'document';
      const buffer = fs.readFileSync(file.filepath);
      const ext = filename.split('.').pop() || '';
      const storagePath = `voter_documents/${voter_id}/${Date.now()}-${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: false,
        });
      if (uploadErr) return res.status(500).json({ error: uploadErr.message });

      const { data: doc, error: insertErr } = await supabase
        .from('voter_documents')
        .insert({
          voter_id,
          document_type: document_type.trim() || 'Other',
          storage_path: storagePath,
          file_name: filename,
          uploaded_by: user.id,
        })
        .select()
        .single();
      if (insertErr) return res.status(500).json({ error: insertErr.message });
      return res.status(201).json(doc);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message || 'Upload failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
