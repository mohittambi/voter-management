import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceRoleClient();
    const { start_date, end_date } = req.query;

    // Get voter profiles with status
    let query = supabase
      .from('voter_profiles')
      .select('id, status, voter_id, master_voters!inner(booth_number, gender, age, created_at)');
    
    if (start_date) {
      query = query.gte('master_voters.created_at', start_date as string);
    }
    if (end_date) {
      query = query.lte('master_voters.created_at', end_date as string);
    }

    const { data: profileData } = await query.not('status', 'is', null);

    // Get total count for percentage
    const totalVoters = profileData?.length || 0;

    // Aggregate by status
    const statusStats: Record<string, any> = {};
    
    profileData?.forEach((profile: any) => {
      const status = profile.status;
      if (!statusStats[status]) {
        statusStats[status] = {
          status,
          count: 0,
          percentage: 0,
          male_count: 0,
          female_count: 0,
          avg_age: 0,
          age_sum: 0,
          age_count: 0,
          booth_distribution: {} as Record<number, number>
        };
      }
      
      statusStats[status].count++;
      
      if (profile.master_voters?.gender === 'M') statusStats[status].male_count++;
      if (profile.master_voters?.gender === 'F') statusStats[status].female_count++;
      
      if (profile.master_voters?.age) {
        statusStats[status].age_sum += profile.master_voters.age;
        statusStats[status].age_count++;
      }
      
      const booth = profile.master_voters?.booth_number;
      if (booth) {
        statusStats[status].booth_distribution[booth] = 
          (statusStats[status].booth_distribution[booth] || 0) + 1;
      }
    });

    // Calculate percentages and averages
    Object.values(statusStats).forEach((stats: any) => {
      stats.percentage = totalVoters > 0 ? ((stats.count / totalVoters) * 100).toFixed(2) : 0;
      if (stats.age_count > 0) {
        stats.avg_age = Math.round(stats.age_sum / stats.age_count);
      }
      // Get top 3 booths for this status
      const topBooths = Object.entries(stats.booth_distribution)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 3)
        .map((entry: any) => `${entry[0]}(${entry[1]})`)
        .join('; ');
      stats.top_booths = topBooths || '-';
    });

    // Convert to CSV
    const rows = Object.values(statusStats).sort((a: any, b: any) => b.count - a.count);
    
    const csvHeader = 'स्थिती / Status,संख्या / Count,टक्केवारी / Percentage,पुरुष / Male,स्त्री / Female,सरासरी वय / Avg Age,शीर्ष बुथ / Top Booths\n';
    const csvRows = rows.map((row: any) => 
      `${row.status},${row.count},${row.percentage}%,${row.male_count},${row.female_count},${row.avg_age},"${row.top_booths}"`
    ).join('\n');
    
    const csv = csvHeader + csvRows;

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="status-wise-report-${new Date().toISOString().split('T')[0]}.csv"`);
    
    // Add BOM for Excel UTF-8 support
    return res.send('\uFEFF' + csv);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
}
