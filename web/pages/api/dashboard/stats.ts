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
      { count: totalEmployees },
      { count: totalVillages },
    ] = await Promise.all([
      supabase.from('master_voters').select('*', { count: 'exact', head: true }),
      supabase.from('voter_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('workers').select('*', { count: 'exact', head: true }),
      supabase.from('employees').select('*', { count: 'exact', head: true }),
      supabase.from('villages').select('*', { count: 'exact', head: true }),
    ]);

    // Section B: Service request metrics — use count queries instead of fetching all rows
    const [
      { count: totalRequests },
      ...statusCounts
    ] = await Promise.all([
      supabase.from('service_requests').select('*', { count: 'exact', head: true }),
      ...SR_STATUSES.map(status =>
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', status)
      ),
    ]);

    const statusBreakdown: Record<string, number> = {};
    SR_STATUSES.forEach((s, i) => {
      statusBreakdown[s] = statusCounts[i]?.count ?? 0;
    });

    // Unique raisers and top service types — limit to last 90 days to keep query fast
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const since = ninetyDaysAgo.toISOString();

    const { data: raiserRows } = await supabase
      .from('service_requests')
      .select('created_by')
      .not('created_by', 'is', null)
      .gte('created_at', since);
    const uniqueRaisers = new Set((raiserRows || []).map((r: any) => r.created_by)).size;

    const { data: typeIds } = await supabase
      .from('service_requests')
      .select('service_type_id')
      .gte('created_at', since);
    const typeCounts: Record<string, number> = {};
    (typeIds || []).forEach((r: any) => {
      const id = r.service_type_id;
      typeCounts[id] = (typeCounts[id] || 0) + 1;
    });
    const top3Ids = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    const topServiceTypes: { name: string; count: number }[] = [];
    if (top3Ids.length > 0) {
      const { data: typeNames } = await supabase
        .from('service_types')
        .select('id, name')
        .in('id', top3Ids);
      const nameMap = Object.fromEntries((typeNames || []).map((t: any) => [t.id, t.name || t.id]));
      top3Ids.forEach(id => {
        topServiceTypes.push({ name: nameMap[id] || id, count: typeCounts[id] || 0 });
      });
    }

    return res.json({
      voters: {
        total: totalVoters || 0,
        profiles: totalProfiles || 0,
        families: totalFamilies || 0,
        workers: totalWorkers || 0,
        employees: totalEmployees || 0,
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
