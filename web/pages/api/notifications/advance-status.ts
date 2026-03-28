import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { sendWhatsApp, sendSMS } from '../../../lib/messaging';

const NOTIFICATIONS_SECRET = process.env.NOTIFICATIONS_SECRET || '';

const STATUS_DOCUMENT_SUBMITTED = 'Document Submitted';
const STATUS_DOCUMENT_SHARED = 'Document Shared to Office';
const STATUS_WORK_IN_PROGRESS = 'Work in Progress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['x-notifications-secret'];
  if (NOTIFICATIONS_SECRET && authHeader !== NOTIFICATIONS_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const supabase = getServiceRoleClient();
  const now = new Date();
  const advancedToShared: string[] = [];
  const advancedToWip: string[] = [];

  // 1) Advance Document Submitted → Document Shared to Office (after hours_to_share)
  const { data: submittedList } = await supabase
    .from('service_requests')
    .select('id, ticket_number, service_type_id, service_types(hours_to_share)')
    .eq('status', STATUS_DOCUMENT_SUBMITTED);

  for (const sr of submittedList || []) {
    const hoursToShare = (sr.service_types as any)?.hours_to_share ?? 10;
    const { data: logs } = await supabase
      .from('service_request_status_logs')
      .select('changed_at')
      .eq('request_id', sr.id)
      .order('changed_at', { ascending: false })
      .limit(1);
    const lastChanged = logs?.[0]?.changed_at;
    if (!lastChanged) continue;
    const elapsedHours = (now.getTime() - new Date(lastChanged).getTime()) / (1000 * 60 * 60);
    if (elapsedHours >= hoursToShare) {
      await supabase
        .from('service_requests')
        .update({ status: STATUS_DOCUMENT_SHARED, updated_at: now.toISOString() })
        .eq('id', sr.id);
      await supabase.from('service_request_status_logs').insert({
        request_id: sr.id,
        status: STATUS_DOCUMENT_SHARED,
        changed_by: null,
        changed_at: now.toISOString(),
      });
      advancedToShared.push(sr.id);

      const { data: srData } = await supabase
        .from('service_requests')
        .select('service_types(name), master_voters(voter_profiles!voter_profiles_voter_id_fkey(mobile))')
        .eq('id', sr.id)
        .single();
      const mvRaw = srData?.master_voters;
      const mv = Array.isArray(mvRaw) ? mvRaw[0] : mvRaw;
      const vpRaw = mv?.voter_profiles;
      const vp = Array.isArray(vpRaw) ? vpRaw[0] : vpRaw;
      const mobile = vp?.mobile;
      if (mobile) {
        const ticketDisplay = `VED-${String((sr as any)?.ticket_number ?? 0).padStart(6, '0')}`;
        const msg = `नमस्कार,\n\nमा. मंत्री बाळासाहेब थोरात यांच्या यशोधन कार्यालय, मनोली येथे आपला अर्ज क्र. ${ticketDisplay} प्राप्त झाला होता.\n\nसदर अर्ज पुढील कार्यवाहीसाठी संबंधित शासकीय कार्यालयाकडे पाठविण्यात आला असून, समन्वयासाठी श्री. पवन साबळे (मो. 9850300481) यांच्याकडे सोपविण्यात आला आहे.\n\nधन्यवाद.`;
        await Promise.all([
          sendWhatsApp(mobile, {
            event: 'service_request_auto_advanced_shared',
            bodyParams: [ticketDisplay],
          }),
          sendSMS(mobile, msg),
        ]);
      }
    }
  }

  // 2) Advance Document Shared to Office → Work in Progress (after hours_to_wip)
  const { data: sharedList } = await supabase
    .from('service_requests')
    .select('id, service_type_id, service_types(hours_to_wip)')
    .eq('status', STATUS_DOCUMENT_SHARED);

  for (const sr of sharedList || []) {
    const hoursToWip = (sr.service_types as any)?.hours_to_wip ?? 48;
    const { data: logs } = await supabase
      .from('service_request_status_logs')
      .select('changed_at')
      .eq('request_id', sr.id)
      .order('changed_at', { ascending: false })
      .limit(1);
    const lastChanged = logs?.[0]?.changed_at;
    if (!lastChanged) continue;
    const elapsedHours = (now.getTime() - new Date(lastChanged).getTime()) / (1000 * 60 * 60);
    if (elapsedHours >= hoursToWip) {
      await supabase
        .from('service_requests')
        .update({ status: STATUS_WORK_IN_PROGRESS, updated_at: now.toISOString() })
        .eq('id', sr.id);
      await supabase.from('service_request_status_logs').insert({
        request_id: sr.id,
        status: STATUS_WORK_IN_PROGRESS,
        changed_by: null,
        changed_at: now.toISOString(),
      });
      advancedToWip.push(sr.id);

      const { data: srData } = await supabase
        .from('service_requests')
        .select('service_types(name), master_voters(voter_profiles!voter_profiles_voter_id_fkey(mobile))')
        .eq('id', sr.id)
        .single();
      const mvRaw = srData?.master_voters;
      const mv = Array.isArray(mvRaw) ? mvRaw[0] : mvRaw;
      const vpRaw = mv?.voter_profiles;
      const vp = Array.isArray(vpRaw) ? vpRaw[0] : vpRaw;
      const mobile = vp?.mobile;
      const stRaw = srData?.service_types;
      const serviceTypeName = (Array.isArray(stRaw) ? stRaw[0] : stRaw)?.name || '';
      if (mobile) {
        const ticketDisplayWip = `VED-${String((sr as any)?.ticket_number ?? 0).padStart(6, '0')}`;
        const msg = `नमस्कार,\n\nमा. मंत्री बाळासाहेब थोरात यांच्या यशोधन कार्यालय, मनोली येथे आपला अर्ज क्र. ${ticketDisplayWip} याची कार्यवाही पूर्ण झाली आहे.\n\nकृपया आपली कागदपत्रे कार्यालयातून प्राप्त करून घ्यावीत. अधिक माहितीसाठी श्री. पवन साबळे (मो. 9850300481) यांच्याशी संपर्क साधावा.\n\nधन्यवाद.`;
        await Promise.all([
          sendWhatsApp(mobile, {
            event: 'service_request_auto_advanced_wip',
            bodyParams: [ticketDisplayWip],
          }),
          sendSMS(mobile, msg),
        ]);
      }
    }
  }

  return res.json({
    success: true,
    advancedToShared: advancedToShared.length,
    advancedToWip: advancedToWip.length,
    idsToShared: advancedToShared,
    idsToWip: advancedToWip,
  });
}
