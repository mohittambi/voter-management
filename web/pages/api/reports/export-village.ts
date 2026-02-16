import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceRoleClient();
    const { start_date, end_date } = req.query;

    // Get voter profiles with village info
    let query = supabase
      .from('voter_profiles')
      .select('id, village, village_id, master_voters!inner(created_at, gender, age), villages(new_gan, new_gat)');
    
    if (start_date) {
      query = query.gte('master_voters.created_at', start_date as string);
    }
    if (end_date) {
      query = query.lte('master_voters.created_at', end_date as string);
    }

    const { data: profileData } = await query.not('village', 'is', null);

    // Get family counts per village
    const { data: familyData } = await supabase
      .from('families')
      .select('id, head_voter_id, voter_profiles!inner(village)');

    // Aggregate by village
    const villageStats: Record<string, any> = {};
    
    profileData?.forEach((profile: any) => {
      const village = profile.village;
      if (!villageStats[village]) {
        villageStats[village] = {
          village_name: village,
          gan: profile.villages?.new_gan || '-',
          gat: profile.villages?.new_gat || '-',
          total_voters: 0,
          male_count: 0,
          female_count: 0,
          avg_age: 0,
          age_sum: 0,
          age_count: 0,
          families_count: 0
        };
      }
      
      villageStats[village].total_voters++;
      
      if (profile.master_voters?.gender === 'M') villageStats[village].male_count++;
      if (profile.master_voters?.gender === 'F') villageStats[village].female_count++;
      
      if (profile.master_voters?.age) {
        villageStats[village].age_sum += profile.master_voters.age;
        villageStats[village].age_count++;
      }
    });

    // Add family counts
    familyData?.forEach((family: any) => {
      const village = family.voter_profiles?.village;
      if (village && villageStats[village]) {
        villageStats[village].families_count++;
      }
    });

    // Calculate averages
    Object.values(villageStats).forEach((stats: any) => {
      if (stats.age_count > 0) {
        stats.avg_age = Math.round(stats.age_sum / stats.age_count);
      }
    });

    // Convert to CSV
    const rows = Object.values(villageStats).sort((a: any, b: any) => b.total_voters - a.total_voters);
    
    const csvHeader = 'गाव / Village,गण / Gan,गट / Gat,एकूण मतदार / Total Voters,पुरुष / Male,स्त्री / Female,सरासरी वय / Avg Age,कुटुंबे / Families\n';
    const csvRows = rows.map((row: any) => 
      `${row.village_name},${row.gan},${row.gat},${row.total_voters},${row.male_count},${row.female_count},${row.avg_age},${row.families_count}`
    ).join('\n');
    
    const csv = csvHeader + csvRows;

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="village-wise-report-${new Date().toISOString().split('T')[0]}.csv"`);
    
    // Add BOM for Excel UTF-8 support
    return res.send('\uFEFF' + csv);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
}
