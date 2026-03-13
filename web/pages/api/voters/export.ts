import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    q = '',
    booth = '',
    village = '',
    gender = '',
    caste = '',
    ageMin = '',
    ageMax = '',
    status = '',
    familyHead = '',
    workerId = '',
  } = req.query as Record<string, string>;

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from('master_voters')
      .select(`
        id,
        voter_id,
        first_name,
        middle_name,
        surname,
        name_english,
        name_marathi,
        booth_number,
        serial_number,
        age,
        gender,
        caste,
        assembly_constituency,
        voter_profiles!left(
          mobile,
          mobile_secondary,
          status,
          village,
          address_marathi,
          worker_id,
          workers(id, name, mobile),
          employees(name, employee_id)
        )
      `)
      .order('serial_number', { ascending: true });

    // Search: name, voter_id, mobile
    let mobileVoterIds: string[] = [];
    if (q.trim()) {
      const term = q.trim();
      const { data: profileData } = await supabase
        .from('voter_profiles')
        .select('voter_id')
        .or(`mobile.ilike.%${term}%,mobile_secondary.ilike.%${term}%`);
      mobileVoterIds = (profileData || []).map((p: any) => p.voter_id).filter(Boolean);
      const orParts = [
        `first_name.ilike.%${term}%`,
        `surname.ilike.%${term}%`,
        `voter_id.ilike.%${term}%`,
        `name_marathi.ilike.%${term}%`,
        `name_english.ilike.%${term}%`,
        `surname_marathi.ilike.%${term}%`,
      ];
      if (mobileVoterIds.length > 0) orParts.push(`id.in.(${mobileVoterIds.join(',')})`);
      query = query.or(orParts.join(','));
    }

    if (booth) query = query.eq('booth_number', parseInt(booth));
    if (gender) query = query.eq('gender', gender);
    if (caste) query = query.ilike('caste', `%${caste}%`);
    if (ageMin) query = query.gte('age', parseInt(ageMin));
    if (ageMax) query = query.lte('age', parseInt(ageMax));

    if (familyHead === 'head') {
      const { data: heads } = await supabase.from('families').select('head_voter_id').not('head_voter_id', 'is', null);
      const ids = (heads || []).map((h: any) => h.head_voter_id).filter(Boolean);
      if (ids.length === 0) {
        const csv = '\uFEFF' + 'Voter ID,First Name,Middle Name,Surname,Full Name (English),Full Name (Marathi),Booth,Serial No.,Age,Gender,Caste,Assembly Constituency,Mobile,Mobile 2,Status,Village,Address (Marathi),Staff,Staff Mobile,Employee,Employee ID\n';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="voters-export-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      query = query.in('id', ids);
    } else if (familyHead === 'member') {
      const { data: members } = await supabase.from('family_members').select('voter_id');
      const ids = (members || []).map((m: any) => m.voter_id).filter(Boolean);
      if (ids.length === 0) {
        const csv = '\uFEFF' + 'Voter ID,First Name,Middle Name,Surname,Full Name (English),Full Name (Marathi),Booth,Serial No.,Age,Gender,Caste,Assembly Constituency,Mobile,Mobile 2,Status,Village,Address (Marathi),Staff,Staff Mobile,Employee,Employee ID\n';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="voters-export-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }
      query = query.in('id', ids);
    }

    const { data, error } = await query.limit(10000);

    if (error) throw error;

    const rows = (data || []).map((v: any) => {
      const p = Array.isArray(v.voter_profiles) ? v.voter_profiles[0] : v.voter_profiles;
      const w = p?.workers;
      const e = p?.employees;
      return {
        worker_id: p?.worker_id || '',
        voter_id: v.voter_id,
        first_name: v.first_name,
        middle_name: v.middle_name,
        surname: v.surname,
        name_english: v.name_english || [v.first_name, v.middle_name, v.surname].filter(Boolean).join(' '),
        name_marathi: v.name_marathi || '',
        booth_number: v.booth_number,
        serial_number: v.serial_number,
        age: v.age,
        gender: v.gender,
        caste: v.caste,
        assembly_constituency: v.assembly_constituency,
        mobile: p?.mobile || '',
        mobile_secondary: p?.mobile_secondary || '',
        status: p?.status || 'Active',
        village: p?.village || '',
        address_marathi: p?.address_marathi || '',
        worker_name: w?.name || '',
        worker_mobile: w?.mobile || '',
        employee_name: e?.name || '',
        employee_id: e?.employee_id || '',
      };
    });

    let filtered = rows;
    if (village.trim()) filtered = filtered.filter(r => r.village.toLowerCase().includes(village.toLowerCase()));
    if (status) filtered = filtered.filter(r => r.status === status);
    if (workerId.trim()) filtered = filtered.filter(r => r.worker_id === workerId.trim());

    const header = [
      'Voter ID', 'First Name', 'Middle Name', 'Surname', 'Full Name (English)', 'Full Name (Marathi)',
      'Booth', 'Serial No.', 'Age', 'Gender', 'Caste', 'Assembly Constituency',
      'Mobile', 'Mobile 2', 'Status', 'Village', 'Address (Marathi)',
      'Staff', 'Staff Mobile', 'Employee', 'Employee ID',
    ].join(',');

    const csvRows = filtered.map((r: any) =>
      [
        r.voter_id, r.first_name, r.middle_name, r.surname, r.name_english, r.name_marathi,
        r.booth_number, r.serial_number, r.age, r.gender, r.caste, r.assembly_constituency,
        r.mobile, r.mobile_secondary, r.status, r.village, r.address_marathi,
        r.worker_name, r.worker_mobile, r.employee_name, r.employee_id,
      ].map(f => `"${String(f ?? '').replace(/"/g, '""')}"`).join(',')
    );

    const csv = '\uFEFF' + header + '\n' + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="voters-export-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
}
