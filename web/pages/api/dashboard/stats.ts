import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

const SR_STATUSES = [
  'Document Submitted',
  'Document Shared to Office',
  'Work in Progress',
  'Work Completed',
  'Closed / Delivered',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = getServiceRoleClient();

    // Section A: Voter metrics — parallel counts
    const [
      { count: totalVoters },
      { count: totalProfiles },
      { count: totalFamilies },
      { count: totalWorkers },
      { count: totalVillages },
    ] = await Promise.all([
      supabase.from('master_voters').select('*', { count: 'exact', head: true }),
      supabase.from('voter_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('workers').select('*', { count: 'exact', head: true }),
      supabase.from('villages').select('*', { count: 'exact', head: true }),
    ]);

    // Section B: Service request metrics
    const { count: totalRequests } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true });

    // Status breakdown
    const { data: srRows } = await supabase
      .from('service_requests')
      .select('status');

    const statusBreakdown: Record<string, number> = {};
    SR_STATUSES.forEach(s => { statusBreakdown[s] = 0; });
    (srRows || []).forEach((r: any) => {
      if (statusBreakdown[r.status] !== undefined) statusBreakdown[r.status]++;
    });

    // Unique raisers
    const uniqueRaisers = new Set((srRows || []).map((r: any) => r.created_by).filter(Boolean)).size;

    // Top service types (top 3)
    const { data: stRows } = await supabase
      .from('service_requests')
      .select('service_type_id, service_types(name)');

    const stCounts: Record<string, { name: string; count: number }> = {};
    (stRows || []).forEach((r: any) => {
      const id = r.service_type_id;
      const name = r.service_types?.name || id;
      if (!stCounts[id]) stCounts[id] = { name, count: 0 };
      stCounts[id].count++;
    });
    const topServiceTypes = Object.values(stCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return res.json({
      voters: {
        total: totalVoters || 0,
        profiles: totalProfiles || 0,
        families: totalFamilies || 0,
        workers: totalWorkers || 0,
        villages: totalVillages || 0,
      },
      serviceRequests: {
        total: totalRequests || 0,
        uniqueRaisers,
        statusBreakdown,
        topServiceTypes,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to fetch stats' });
  }
}
