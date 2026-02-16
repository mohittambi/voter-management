import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceRoleClient();
    const { start_date, end_date } = req.query;

    // Get all workers
    const { data: workers } = await supabase
      .from('workers')
      .select('*')
      .order('name');

    if (!workers) {
      return res.json({ workers: [] });
    }

    // Get voter profiles with worker assignments
    let profileQuery = supabase
      .from('voter_profiles')
      .select('id, worker_id, status, mobile, village, voter_id, master_voters!inner(created_at)');
    
    if (start_date) profileQuery = profileQuery.gte('master_voters.created_at', start_date as string);
    if (end_date) profileQuery = profileQuery.lte('master_voters.created_at', end_date as string);
    
    const { data: profiles } = await profileQuery;

    // Get families
    const { data: families } = await supabase
      .from('families')
      .select('id, head_voter_id');

    // Calculate metrics for each worker
    const workerMetrics = workers.map(worker => {
      // Get all profiles assigned to this worker
      const assignedProfiles = profiles?.filter(p => p.worker_id === worker.id) || [];
      
      const totalVoters = assignedProfiles.length;
      const activeVoters = assignedProfiles.filter(p => p.status === 'Active').length;
      const votersWithMobile = assignedProfiles.filter(p => p.mobile).length;
      
      // Get unique villages covered
      const villages = new Set(assignedProfiles.map(p => p.village).filter(Boolean));
      const villagesCovered = villages.size;
      
      // Count families where head is assigned to this worker
      const voterIds = new Set(assignedProfiles.map(p => p.voter_id));
      const familiesCovered = families?.filter(f => voterIds.has(f.head_voter_id)).length || 0;
      
      // Calculate rates
      const activeRate = totalVoters > 0 ? (activeVoters / totalVoters) * 100 : 0;
      const contactCompletionRate = totalVoters > 0 ? (votersWithMobile / totalVoters) * 100 : 0;
      
      // Calculate performance score (0-100)
      // 40% - Voter assignment (normalize to max 500 voters = 100%)
      // 30% - Active voter rate
      // 30% - Contact completion rate
      const maxVoters = 500; // Adjust this based on your data
      const assignmentScore = Math.min((totalVoters / maxVoters) * 100, 100);
      const performanceScore = (
        (assignmentScore * 0.4) +
        (activeRate * 0.3) +
        (contactCompletionRate * 0.3)
      );
      
      return {
        id: worker.id,
        name: worker.name,
        mobile: worker.mobile,
        epic_number: worker.epic_number,
        assigned_voters: totalVoters,
        active_voters: activeVoters,
        active_rate: Math.round(activeRate),
        voters_with_mobile: votersWithMobile,
        contact_completion_rate: Math.round(contactCompletionRate),
        families_covered: familiesCovered,
        villages_covered: villagesCovered,
        performance_score: Math.round(performanceScore),
      };
    });

    // Sort by performance score (descending)
    workerMetrics.sort((a, b) => b.performance_score - a.performance_score);

    return res.json({ workers: workerMetrics });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to fetch worker performance' });
  }
}
