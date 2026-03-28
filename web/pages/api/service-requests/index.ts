import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, sendSMS } from '../../../lib/messaging';

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
  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    const {
      page = '1', pageSize = '50',
      q = '', service_type = '', status = '',
      village = '', date_from = '', date_to = '',
      raised_by = '', voter_id: voterIdParam = '',
    } = req.query as Record<string, string>;

    const ps = Math.min(parseInt(pageSize) || 50, 100);
    const pg = Math.max(parseInt(page) || 1, 1);
    const from = (pg - 1) * ps;
    const to = from + ps - 1;

    let query = supabase
      .from('service_requests')
      .select(`
        id,
        status,
        notes,
        created_at,
        updated_at,
        created_by,
        voter_id,
        service_type_id,
        master_voters!inner(id, voter_id, name_english, name_marathi, first_name, surname, voter_profiles!voter_profiles_voter_id_fkey(mobile, village)),
        service_types(id, name)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (service_type) query = query.eq('service_type_id', service_type);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to + 'T23:59:59');
    if (raised_by) query = query.eq('created_by', raised_by);
    if (voterIdParam.trim()) query = query.eq('voter_id', voterIdParam.trim());

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    let rows = (data || []).map((r: any) => {
      const voter = r.master_voters;
      const profile = voter?.voter_profiles;
      const profileData = Array.isArray(profile) ? profile[0] : profile;
      return {
        id: r.id,
        status: r.status,
        notes: r.notes,
        created_at: r.created_at,
        updated_at: r.updated_at,
        created_by: r.created_by,
        voter_id: voter?.id,
        voter_epic: voter?.voter_id,
        voter_name_english: voter?.name_english || `${voter?.first_name || ''} ${voter?.surname || ''}`.trim(),
        voter_name_marathi: voter?.name_marathi || '',
        village: profileData?.village || '',
        mobile: profileData?.mobile || '',
        service_type_id: r.service_type_id,
        service_type_name: r.service_types?.name || '',
      };
    });

    // Post-filter by search query and village (left-join limitation)
    if (q.trim()) {
      const t = q.toLowerCase();
      rows = rows.filter(r =>
        r.voter_name_english.toLowerCase().includes(t) ||
        r.voter_name_marathi.includes(t) ||
        r.voter_epic?.toLowerCase().includes(t) ||
        r.id.toLowerCase().includes(t)
      );
    }
    if (village.trim()) {
      rows = rows.filter(r => r.village.toLowerCase().includes(village.toLowerCase()));
    }

    return res.json({ data: rows, total: count || 0, page: pg, pageSize: ps });
  }

  if (req.method === 'POST') {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { voter_id, service_type_id, notes } = req.body;
    if (!voter_id || !service_type_id) return res.status(400).json({ error: 'voter_id and service_type_id are required' });

    const { data: sr, error } = await supabase
      .from('service_requests')
      .insert({ voter_id, service_type_id, notes, created_by: user.id, status: 'Document Submitted' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log initial status
    await supabase.from('service_request_status_logs').insert({
      request_id: sr.id,
      status: 'Document Submitted',
      changed_by: user.id,
      changed_at: sr.created_at,
    });

    // Notify voter on new service request
    const ticketDisplay = `VED-${String(sr.ticket_number ?? 0).padStart(6, '0')}`;
    const profileRes = await supabase.from('voter_profiles').select('mobile').eq('voter_id', voter_id).single();
    const voterMobile = profileRes.data?.mobile;
    if (voterMobile) {
      const msg = `नमस्कार,\nवेदांत कार्यालय येथे आपला अर्ज क्रमांक ${ticketDisplay} प्राप्त झाला आहे.\nअधिक माहितीसाठी संपर्क करा: ९८८११७७४४४`;
      await Promise.all([
        sendWhatsApp(voterMobile, {
          event: 'service_request_created',
          bodyParams: [msg],
        }),
        sendSMS(voterMobile, msg),
      ]);
    }

    return res.status(201).json(sr);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
