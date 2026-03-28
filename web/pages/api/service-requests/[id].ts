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

function buildStatusNotification(status: string, ticketDisplay: string) {
  if (status === 'Document Submitted') {
    return `नमस्कार,\nवेदांत कार्यालय येथे आपला अर्ज क्रमांक ${ticketDisplay} प्राप्त झाला आहे.\nअधिक माहितीसाठी संपर्क करा: ९८८११७७४४४`;
  }
  if (status === 'Document Shared to Office') {
    return `नमस्कार,\nवेदांत कार्यालय येथे दाखल झालेला आपला अर्ज क्रमांक ${ticketDisplay} पुढील कार्यवाहीसाठी शासकीय कार्यालयात पाठविण्यात आला आहे.\nअधिक माहितीसाठी संपर्क करा: ९८८११७७४४४`;
  }
  if (status === 'Work Completed') {
    return `नमस्कार,\nवेदांत कार्यालय येथे आपला अर्ज क्रमांक ${ticketDisplay} याची कार्यवाही पूर्ण झाली आहे.\nकृपया आपली कागदपत्रे कार्यालयातून प्राप्त करून घ्यावीत.\nअधिक माहितीसाठी संपर्क करा: ९८८११७७४४४`;
  }
  if (status === 'Closed / Delivered') {
    return `नमस्कार,\nवेदांत कार्यालय येथे आपला अर्ज क्रमांक ${ticketDisplay} याची कार्यवाही पूर्ण करून संबंधित कागदपत्रे आपल्याकडे हस्तांतरित करण्यात आली आहेत.\nवेदांत कार्यालयास आपल्या सेवेसाठी संधी दिल्याबद्दल आम्ही आपले आभारी आहोत.\nअधिक माहितीसाठी संपर्क करा: ९८८११७७४४४`;
  }
  return `नमस्कार,\nआपल्या अर्ज क्रमांक ${ticketDisplay} ची स्थिती: ${status}\nअधिक माहितीसाठी संपर्क करा: ९८८११७७४४४`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    const { data: sr, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        master_voters(id, voter_id, name_english, name_marathi, first_name, surname, voter_profiles!voter_profiles_voter_id_fkey(mobile, village)),
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
      .select('service_types(name), master_voters(voter_profiles!voter_profiles_voter_id_fkey(mobile))')
      .eq('id', id)
      .single();
    const mvRaw = srData.data?.master_voters;
    const mv = Array.isArray(mvRaw) ? mvRaw[0] : mvRaw;
    const vpRaw = mv?.voter_profiles;
    const vp = Array.isArray(vpRaw) ? vpRaw[0] : vpRaw;
    const mobile = vp?.mobile;
    if (mobile) {
      const ticketDisplay = `VED-${String(updated?.ticket_number ?? 0).padStart(6, '0')}`;
      const msg = buildStatusNotification(status, ticketDisplay);
      await Promise.all([
        sendWhatsApp(mobile, {
          event: 'service_request_status_changed',
          bodyParams: [msg],
        }),
        sendSMS(mobile, msg),
      ]);
    }

    return res.json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
