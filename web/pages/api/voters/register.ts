import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function getSessionUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

function generateNonVoterId(): string {
  return `NV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { first_name, middle_name, surname, mobile, dob, reference_voter_id } = req.body;
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/3117ed0b-c314-4a71-bd4e-a398b9675dff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/voters/register.ts:handler', message: 'register entry', data: { hypothesisId: 'H3', hasFirst: !!first_name, hasSurname: !!surname, hasRefId: !!reference_voter_id }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
  if (!first_name || !surname) return res.status(400).json({ error: 'first_name and surname are required' });
  if (!reference_voter_id) return res.status(400).json({ error: 'reference_voter_id is required' });

  const supabase = getServiceRoleClient();

  const { data: refVoter } = await supabase
    .from('master_voters')
    .select('id')
    .eq('id', reference_voter_id)
    .single();
  if (!refVoter) return res.status(400).json({ error: 'Reference voter not found' });
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/3117ed0b-c314-4a71-bd4e-a398b9675dff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/voters/register.ts:handler', message: 'ref voter ok', data: { hypothesisId: 'H3' }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
  const nameEnglish = [first_name, middle_name, surname].filter(Boolean).map((s: string) => s?.trim()).join(' ').trim();
  const nameMarathi = nameEnglish;

  let voterId = generateNonVoterId();
  let exists = await supabase.from('master_voters').select('id').eq('voter_id', voterId).single();
  while (exists.data) {
    voterId = generateNonVoterId();
    exists = await supabase.from('master_voters').select('id').eq('voter_id', voterId).single();
  }

  const masterPayload = {
    first_name: (first_name || '').trim() || null,
    middle_name: (middle_name || '').trim() || null,
    surname: (surname || '').trim() || null,
    voter_id: voterId,
    name_english: nameEnglish || null,
    name_marathi: nameMarathi || null,
    is_non_voter: true,
  };

  const { data: master, error: masterErr } = await supabase
    .from('master_voters')
    .insert(masterPayload)
    .select()
    .single();

  if (masterErr) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3117ed0b-c314-4a71-bd4e-a398b9675dff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/voters/register.ts:handler', message: 'master insert failed', data: { hypothesisId: 'H3', error: masterErr.message }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    return res.status(500).json({ error: masterErr.message });
  }
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/3117ed0b-c314-4a71-bd4e-a398b9675dff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/voters/register.ts:handler', message: 'master insert ok', data: { hypothesisId: 'H5', masterId: master.id }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
  const profilePayload = {
    voter_id: master.id,
    reference_voter_id: reference_voter_id,
    mobile: (mobile || '').trim() || null,
    dob: dob || null,
  };

  const { error: profileErr } = await supabase.from('voter_profiles').insert(profilePayload);
  if (profileErr) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/3117ed0b-c314-4a71-bd4e-a398b9675dff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/voters/register.ts:handler', message: 'profile insert failed', data: { hypothesisId: 'H5', error: profileErr.message }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    await supabase.from('master_voters').delete().eq('id', master.id);
    return res.status(500).json({ error: profileErr.message });
  }
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/3117ed0b-c314-4a71-bd4e-a398b9675dff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/voters/register.ts:handler', message: 'profile insert ok', data: { hypothesisId: 'H5', reference_voter_id: reference_voter_id }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
  return res.status(201).json({
    id: master.id,
    voter_id: master.voter_id,
    name_english: master.name_english,
    name_marathi: master.name_marathi,
    first_name: master.first_name,
    middle_name: master.middle_name,
    surname: master.surname,
  });
}
