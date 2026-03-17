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
  if (!first_name || !surname) return res.status(400).json({ error: 'first_name and surname are required' });
  if (!reference_voter_id) return res.status(400).json({ error: 'reference_voter_id is required' });

  const supabase = getServiceRoleClient();

  const { data: refVoter } = await supabase
    .from('master_voters')
    .select('id')
    .eq('id', reference_voter_id)
    .single();
  if (!refVoter) return res.status(400).json({ error: 'Reference voter not found' });

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

  if (masterErr) return res.status(500).json({ error: masterErr.message });

  const profilePayload = {
    voter_id: master.id,
    reference_voter_id: reference_voter_id,
    mobile: (mobile || '').trim() || null,
    dob: dob || null,
  };

  const { error: profileErr } = await supabase.from('voter_profiles').insert(profilePayload);
  if (profileErr) {
    await supabase.from('master_voters').delete().eq('id', master.id);
    return res.status(500).json({ error: profileErr.message });
  }

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
