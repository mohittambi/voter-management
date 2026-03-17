import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';
import { sendWhatsApp, sendSMS } from '../../../lib/messaging';

const NOTIFICATIONS_SECRET = process.env.NOTIFICATIONS_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify secret to prevent unauthorised triggering
  const authHeader = req.headers['x-notifications-secret'];
  if (NOTIFICATIONS_SECRET && authHeader !== NOTIFICATIONS_SECRET) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const supabase = getServiceRoleClient();

  // Get today as MM-DD in IST (UTC+5:30)
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const todayMMDD = `${month}-${day}`;

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.NEXT_PUBLIC_APP_URL || 'https://office.vedant.info');

  const { data, error } = await supabase
    .from('voter_profiles')
    .select(`
      mobile,
      dob,
      anniversary_date,
      data_validated,
      master_voters!voter_profiles_voter_id_fkey!inner(id, name_english, name_marathi, first_name, middle_name, surname)
    `)
    .not('mobile', 'is', null);

  if (error) {
    console.error('[daily notifications] Query error:', error);
    return res.status(500).json({ error: error.message });
  }

  const rows = (data || []).filter((r: any) => r.mobile);

  let birthdayCount = 0;
  let anniversaryCount = 0;

  for (const row of rows) {
    const voterRaw = row.master_voters;
    const voter = Array.isArray(voterRaw) ? voterRaw[0] : voterRaw;
    const name =
      (voter as any)?.name_english ||
      [(voter as any)?.first_name, (voter as any)?.middle_name, (voter as any)?.surname]
        .filter(Boolean)
        .join(' ') ||
      'मित्र';

    const mobile = row.mobile as string;
    const voterId = (voter as any)?.id;

    if (row.dob && row.data_validated) {
      const dobMMDD = (row.dob as string).slice(5, 10).replace(/-/g, '-');
      if (dobMMDD === todayMMDD) {
        const pdfLink = voterId ? `${baseUrl}/api/voter-profiles/${voterId}/birthday-pdf` : '';
        const msg = pdfLink
          ? `नमस्कार ${name} जी, Vedant Info कडून आपल्याला वाढदिवसाच्या हार्दिक शुभेच्छा! 🎂 आपले वाढदिवस पत्र येथे डाउनलोड करा: ${pdfLink} धन्यवाद - Vedant Info`
          : `नमस्कार ${name} जी, Vedant Info कडून आपल्याला वाढदिवसाच्या हार्दिक शुभेच्छा! Happy Birthday! 🎂 धन्यवाद - Vedant Info`;
        await Promise.all([sendWhatsApp(mobile, msg), sendSMS(mobile, msg)]);
        birthdayCount++;
      }
    }

    if (row.anniversary_date) {
      const annMMDD = (row.anniversary_date as string).slice(5, 10).replace(/-/g, '-');
      if (annMMDD === todayMMDD) {
        const msg = `नमस्कार ${name} जी, Vedant Info कडून आपल्याला लग्नाच्या वाढदिवसाच्या हार्दिक शुभेच्छा! वर्धापन दिनाच्या शुभेच्छा! धन्यवाद - Vedant Info`;
        await Promise.all([sendWhatsApp(mobile, msg), sendSMS(mobile, msg)]);
        anniversaryCount++;
      }
    }
  }

  return res.json({
    success: true,
    date: todayMMDD,
    birthdaySent: birthdayCount,
    anniversarySent: anniversaryCount,
  });
}
