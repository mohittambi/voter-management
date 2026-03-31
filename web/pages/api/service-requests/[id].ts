import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, sendSMS, WhatsAppEvent } from '../../../lib/messaging';
import {
  buildVedantPersonLine,
  sendVedantOfficeWhatsAppCopy,
  serviceTypeGenitiveMarathi,
  smsVedantWorkCompleted,
} from '../../../lib/vedantServiceNotifications';
import {
  SERVICE_REQUEST_STATUS_ORDER,
  isValidServiceRequestStatusTransition,
} from '../../../lib/serviceRequestStatus';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const VALID_STATUSES = SERVICE_REQUEST_STATUS_ORDER;

async function getSessionUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

function buildStatusNotification(status: string, ticketDisplay: string): string {
  switch (status) {
    case 'Document Submitted':
      return `नमस्कार,\n\nमा. मंत्री बाळासाहेब थोरात यांच्या यशोधन कार्यालय, मनोली येथे आपला अर्ज क्र. ${ticketDisplay} प्राप्त झाला आहे.\n\nसदर अर्ज पुढील कार्यवाहीसाठी श्री. पवन साबळे (मो. 9850300481) यांच्याकडे सोपविण्यात आला आहे.\n\nधन्यवाद.`;
    case 'Document Shared to Office':
      return `नमस्कार,\n\nमा. मंत्री बाळासाहेब थोरात यांच्या यशोधन कार्यालय, मनोली येथे आपला अर्ज क्र. ${ticketDisplay} प्राप्त झाला होता.\n\nसदर अर्ज पुढील कार्यवाहीसाठी संबंधित शासकीय कार्यालयाकडे पाठविण्यात आला असून, समन्वयासाठी श्री. पवन साबळे (मो. 9850300481) यांच्याकडे सोपविण्यात आला आहे.\n\nधन्यवाद.`;
    case 'Work Completed':
      return `नमस्कार,\n\nमा. मंत्री बाळासाहेब थोरात यांच्या यशोधन कार्यालय, मनोली येथे आपला अर्ज क्र. ${ticketDisplay} याची कार्यवाही पूर्ण झाली आहे.\n\nकृपया आपली कागदपत्रे कार्यालयातून प्राप्त करून घ्यावीत. अधिक माहितीसाठी श्री. पवन साबळे (मो. 9850300481) यांच्याशी संपर्क साधावा.\n\nधन्यवाद.`;
    case 'Closed / Delivered':
      return `नमस्कार,\n\nमा. मंत्री बाळासाहेब थोरात यांच्या यशोधन कार्यालय, मनोली येथे आपला अर्ज क्र. ${ticketDisplay} याची कार्यवाही पूर्ण करून संबंधित कागदपत्रे आपल्याकडे हस्तांतरित करण्यात आली आहेत.\n\nयशोधन कार्यालयास आपल्या सेवेसाठी संधी दिल्याबद्दल आम्ही आपले आभारी आहोत. अधिक माहितीसाठी श्री. पवन साबळे (मो. 9850300481) यांच्याशी संपर्क साधावा.\n\nधन्यवाद.`;
    default:
      return `नमस्कार,\nआपल्या अर्ज क्र. ${ticketDisplay} ची स्थिती: ${status}\nअधिक माहितीसाठी श्री. पवन साबळे (मो. 9850300481) यांच्याशी संपर्क साधावा.`;
  }
}

function statusToWhatsAppEvent(status: string): WhatsAppEvent {
  switch (status) {
    case 'Document Submitted':    return 'status_document_submitted';
    case 'Document Shared to Office': return 'status_document_shared';
    case 'Work Completed':        return 'status_work_completed';
    case 'Closed / Delivered':    return 'status_closed_delivered';
    default:                      return 'status_closed_delivered';
  }
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
    if (!(VALID_STATUSES as readonly string[]).includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { data: existing, error: loadErr } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (loadErr || !existing) return res.status(404).json({ error: 'Not found' });

    if (existing.status === status) {
      return res.json(existing);
    }

    const transition = isValidServiceRequestStatusTransition(existing.status, status);
    if (transition.ok === false) {
      return res.status(400).json({ error: transition.message });
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
      .select(
        'service_types(name), master_voters(name_marathi, name_english, first_name, middle_name, surname, voter_profiles!voter_profiles_voter_id_fkey(mobile))'
      )
      .eq('id', id)
      .single();
    const mvRaw = srData.data?.master_voters;
    const mv = Array.isArray(mvRaw) ? mvRaw[0] : mvRaw;
    const vpRaw = mv?.voter_profiles;
    const vp = Array.isArray(vpRaw) ? vpRaw[0] : vpRaw;
    const mobile = vp?.mobile as string | undefined;
    const ticketDisplay = `VED-${String(updated?.ticket_number ?? 0).padStart(6, '0')}`;
    const stRaw = srData.data?.service_types;
    const serviceName = (Array.isArray(stRaw) ? stRaw[0] : stRaw)?.name || '';

    if (status === 'Work Completed' || status === 'Closed / Delivered') {
      const nameMr =
        (mv as any)?.name_marathi ||
        [(mv as any)?.first_name, (mv as any)?.middle_name, (mv as any)?.surname].filter(Boolean).join(' ').trim() ||
        '';
      const nameEn = (mv as any)?.name_english || '';
      const servicePart = serviceTypeGenitiveMarathi(serviceName);
      const personLine = buildVedantPersonLine(nameMr, nameEn, mobile || '');
      const msg = smsVedantWorkCompleted(personLine, servicePart);
      const bodyParams: [string, string] = [personLine, servicePart];
      const tasks: Promise<void>[] = [sendVedantOfficeWhatsAppCopy('vedant_work_completed', bodyParams)];
      if (mobile) {
        tasks.push(
          sendWhatsApp(mobile, { event: 'vedant_work_completed', bodyParams }),
          sendSMS(mobile, msg)
        );
      }
      await Promise.all(tasks);
    } else if (mobile && status !== 'Work in Progress') {
      const msg = buildStatusNotification(status, ticketDisplay);
      await Promise.all([
        sendWhatsApp(mobile, {
          event: statusToWhatsAppEvent(status),
          bodyParams: [ticketDisplay],
        }),
        sendSMS(mobile, msg),
      ]);
    }

    return res.json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
