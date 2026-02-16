import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceRoleClient();
    const { start_date, end_date } = req.query;

    // Build query with optional date filters
    let masterQuery = supabase.from('master_voters').select('booth_number, gender, created_at');
    
    if (start_date) {
      masterQuery = masterQuery.gte('created_at', start_date as string);
    }
    if (end_date) {
      masterQuery = masterQuery.lte('created_at', end_date as string);
    }

    const { data: voterData } = await masterQuery.not('booth_number', 'is', null);

    // Get profile status data
    let profileQuery = supabase.from('voter_profiles').select('voter_id, status');
    const { data: profileData } = await profileQuery;

    // Create status lookup
    const statusMap = new Map<string, string>();
    profileData?.forEach((p: any) => {
      statusMap.set(p.voter_id, p.status);
    });

    // Aggregate by booth
    const boothStats: Record<number, any> = {};
    
    voterData?.forEach((voter: any) => {
      const booth = voter.booth_number;
      if (!boothStats[booth]) {
        boothStats[booth] = {
          booth_number: booth,
          total_voters: 0,
          male_count: 0,
          female_count: 0,
          active_count: 0,
          inactive_count: 0
        };
      }
      
      boothStats[booth].total_voters++;
      
      if (voter.gender === 'M') boothStats[booth].male_count++;
      if (voter.gender === 'F') boothStats[booth].female_count++;
      
      const status = statusMap.get(voter.id);
      if (status === 'Active') boothStats[booth].active_count++;
      else if (status) boothStats[booth].inactive_count++;
    });

    // Convert to CSV
    const rows = Object.values(boothStats).sort((a, b) => a.booth_number - b.booth_number);
    
    const csvHeader = 'बुथ नंबर / Booth Number,एकूण मतदार / Total Voters,पुरुष / Male,स्त्री / Female,सक्रिय / Active,निष्क्रिय / Inactive\n';
    const csvRows = rows.map((row: any) => 
      `${row.booth_number},${row.total_voters},${row.male_count},${row.female_count},${row.active_count},${row.inactive_count}`
    ).join('\n');
    
    const csv = csvHeader + csvRows;

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="booth-wise-report-${new Date().toISOString().split('T')[0]}.csv"`);
    
    // Add BOM for Excel UTF-8 support
    return res.send('\uFEFF' + csv);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
}
