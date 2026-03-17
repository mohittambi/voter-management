import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, sendSMS } from '../../../lib/messaging';

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
        master_voters(id, voter_id, name_english, name_marathi, first_name, surname, voter_profiles(mobile, village)),
        service_types(id, name),
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

    // Notify voter on status change
    const srData = await supabase
      .from('service_requests')
      .select('service_types(name), master_voters(voter_profiles(mobile))')
      .eq('id', id)
      .single();
    const mvRaw = srData.data?.master_voters;
    const mv = Array.isArray(mvRaw) ? mvRaw[0] : mvRaw;
    const vpRaw = mv?.voter_profiles;
    const vp = Array.isArray(vpRaw) ? vpRaw[0] : vpRaw;
    const mobile = vp?.mobile;
    const stRaw = srData.data?.service_types;
    const serviceTypeName = (Array.isArray(stRaw) ? stRaw[0] : stRaw)?.name || '';
    if (mobile) {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.NEXT_PUBLIC_APP_URL || 'https://office.vedant.info');
      const ticketDisplay = `SR-${String(updated?.ticket_number ?? 0).padStart(6, '0')}`;
      const pdfUrl = `${baseUrl}/api/service-requests/${id}/pdf`;
      const msg =
        status === 'Work Completed'
          ? `नमस्कार, आपल्या "${serviceTypeName}" सेवा विनंती पूर्ण झाली आहे. दस्तऐवज ट्रॅकर क्रमांक: ${ticketDisplay}. पूर्णता पत्र डाउनलोड करा: ${pdfUrl}\nधन्यवाद - Vedant Info`
          : `नमस्कार, आपल्या "${serviceTypeName}" सेवा विनंतीची सद्यस्थिती:\n${status}\nधन्यवाद - Vedant Info`;
      await Promise.all([sendWhatsApp(mobile, msg), sendSMS(mobile, msg)]);
    }

    return res.json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
