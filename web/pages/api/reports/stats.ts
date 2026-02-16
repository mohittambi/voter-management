import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = getServiceRoleClient();
    const { start_date, end_date } = req.query;

    // Build base query with optional date filters
    const buildQuery = (table: string) => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (start_date && table === 'master_voters') {
        query = query.gte('created_at', start_date as string);
      }
      if (end_date && table === 'master_voters') {
        query = query.lte('created_at', end_date as string);
      }
      return query;
    };

    // Total counts
    const { count: totalVoters } = await buildQuery('master_voters');

    const { count: totalFamilies } = await supabase
      .from('families')
      .select('*', { count: 'exact', head: true });

    const { count: totalWorkers } = await supabase
      .from('workers')
      .select('*', { count: 'exact', head: true });

    const { count: totalEmployees } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    // Status breakdown (with date filter via join)
    let statusQuery = supabase
      .from('voter_profiles')
      .select('status, master_voters!inner(created_at)')
      .not('status', 'is', null);
    
    if (start_date) statusQuery = statusQuery.gte('master_voters.created_at', start_date as string);
    if (end_date) statusQuery = statusQuery.lte('master_voters.created_at', end_date as string);
    
    const { data: statusData } = await statusQuery;

    const statusCounts: Record<string, number> = {};
    statusData?.forEach((row: any) => {
      statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
    });

    // Gender breakdown (with date filter)
    let genderQuery = supabase
      .from('master_voters')
      .select('gender')
      .not('gender', 'is', null);
    
    if (start_date) genderQuery = genderQuery.gte('created_at', start_date as string);
    if (end_date) genderQuery = genderQuery.lte('created_at', end_date as string);
    
    const { data: genderData } = await genderQuery;

    const genderCounts: Record<string, number> = {};
    genderData?.forEach((row: any) => {
      genderCounts[row.gender] = (genderCounts[row.gender] || 0) + 1;
    });

    // Booth-wise count (with date filter)
    let boothQuery = supabase
      .from('master_voters')
      .select('booth_number')
      .not('booth_number', 'is', null)
      .order('booth_number');
    
    if (start_date) boothQuery = boothQuery.gte('created_at', start_date as string);
    if (end_date) boothQuery = boothQuery.lte('created_at', end_date as string);
    
    const { data: boothData } = await boothQuery;

    const boothCounts: Record<number, number> = {};
    boothData?.forEach((row: any) => {
      boothCounts[row.booth_number] = (boothCounts[row.booth_number] || 0) + 1;
    });

    // Village-wise count (with date filter via join)
    let villageQuery = supabase
      .from('voter_profiles')
      .select('village, master_voters!inner(created_at)')
      .not('village', 'is', null);
    
    if (start_date) villageQuery = villageQuery.gte('master_voters.created_at', start_date as string);
    if (end_date) villageQuery = villageQuery.lte('master_voters.created_at', end_date as string);
    
    const { data: villageData } = await villageQuery;

    const villageCounts: Record<string, number> = {};
    villageData?.forEach((row: any) => {
      villageCounts[row.village] = (villageCounts[row.village] || 0) + 1;
    });

    // Age groups (with date filter)
    let ageQuery = supabase
      .from('master_voters')
      .select('age')
      .not('age', 'is', null);
    
    if (start_date) ageQuery = ageQuery.gte('created_at', start_date as string);
    if (end_date) ageQuery = ageQuery.lte('created_at', end_date as string);
    
    const { data: ageData } = await ageQuery;

    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0,
    };

    ageData?.forEach((row: any) => {
      const age = row.age;
      if (age >= 18 && age <= 25) ageGroups['18-25']++;
      else if (age >= 26 && age <= 35) ageGroups['26-35']++;
      else if (age >= 36 && age <= 45) ageGroups['36-45']++;
      else if (age >= 46 && age <= 55) ageGroups['46-55']++;
      else if (age >= 56 && age <= 65) ageGroups['56-65']++;
      else if (age > 65) ageGroups['65+']++;
    });

    return res.json({
      totals: {
        voters: totalVoters || 0,
        families: totalFamilies || 0,
        workers: totalWorkers || 0,
        employees: totalEmployees || 0,
      },
      status: statusCounts,
      gender: genderCounts,
      booths: boothCounts,
      villages: villageCounts,
      ageGroups,
      dateRange: start_date && end_date ? { start: start_date, end: end_date } : null,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'failed to fetch stats' });
  }
}
