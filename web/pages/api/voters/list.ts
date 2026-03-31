import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    page = '1',
    pageSize = '50',
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
    sortBy = 'serial_number',
    sortDir = 'asc',
  } = req.query as Record<string, string>;

  const ps = Math.min(parseInt(pageSize) || 50, 100);
  const pg = Math.max(parseInt(page) || 1, 1);
  const from = (pg - 1) * ps;
  const to = from + ps - 1;

  const allowed = ['serial_number', 'voter_id', 'name_english', 'name_marathi', 'age', 'booth_number', 'caste'];
  const col = allowed.includes(sortBy) ? sortBy : 'serial_number';
  const dir = sortDir === 'desc';

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from('master_voters')
      .select(`
        id,
        first_name,
        middle_name,
        surname,
        voter_id,
        name_marathi,
        name_english,
        first_name_marathi,
        surname_marathi,
        booth_number,
        serial_number,
        caste,
        age,
        gender,
        assembly_constituency,
        is_non_voter,
        voter_profiles!voter_profiles_voter_id_fkey(
          mobile,
          mobile_secondary,
          status,
          village,
          worker_id,
          data_validated,
          dob,
          address_marathi,
          address_english,
          education,
          occupation,
          caste_category,
          ration_card_type,
          anniversary_date,
          aadhaar_masked,
          email,
          household_relation_code,
          workers(id, name, mobile)
        )
      `, { count: 'exact' });

    // Full-text search: name (EN/MR), voter_id, mobile in voter_profiles
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
        `first_name_marathi.ilike.%${term}%`,
      ];
      if (mobileVoterIds.length > 0) orParts.push(`id.in.(${mobileVoterIds.join(',')})`);
      query = query.or(orParts.join(','));
    }

    if (booth) query = query.eq('booth_number', parseInt(booth));
    if (gender) query = query.eq('gender', gender);
    if (caste) query = query.ilike('caste', `%${caste}%`);
    if (ageMin) query = query.gte('age', parseInt(ageMin));
    if (ageMax) query = query.lte('age', parseInt(ageMax));

    // Family head filter: restrict to family heads or members
    if (familyHead === 'head') {
      const { data: heads } = await supabase.from('families').select('head_voter_id').not('head_voter_id', 'is', null);
      const ids = (heads || []).map((h: any) => h.head_voter_id).filter(Boolean);
      if (ids.length === 0) return res.json({ data: [], total: 0, page: pg, pageSize: ps });
      query = query.in('id', ids);
    } else if (familyHead === 'member') {
      const { data: members } = await supabase.from('family_members').select('voter_id');
      const ids = (members || []).map((m: any) => m.voter_id).filter(Boolean);
      if (ids.length === 0) return res.json({ data: [], total: 0, page: pg, pageSize: ps });
      query = query.in('id', ids);
    }

    // Sort
    query = query.order(col, { ascending: !dir });

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Flatten profiles
    const rows = (data || []).map((v: any) => {
      const profile = Array.isArray(v.voter_profiles) ? v.voter_profiles[0] : v.voter_profiles;
      const worker = profile?.workers;
      return {
        id: v.id,
        voter_id: v.voter_id,
        first_name: v.first_name,
        middle_name: v.middle_name,
        surname: v.surname,
        name_english: v.name_english || [v.first_name, v.middle_name, v.surname].filter(Boolean).join(' '),
        name_marathi: v.name_marathi || '',
        first_name_marathi: v.first_name_marathi ?? null,
        surname_marathi: v.surname_marathi ?? null,
        household_relation_code: profile?.household_relation_code ?? null,
        booth_number: v.booth_number,
        serial_number: v.serial_number,
        caste: v.caste,
        age: v.age,
        gender: v.gender,
        is_non_voter: Boolean((v as { is_non_voter?: boolean }).is_non_voter),
        mobile: profile?.mobile || '',
        mobile_secondary: profile?.mobile_secondary || '',
        status: profile?.status || 'Active',
        village: profile?.village || '',
        worker_id: profile?.worker_id || '',
        worker_name: worker?.name || '',
        data_validated: profile?.data_validated === true,
        dob: profile?.dob ?? null,
        address_marathi: profile?.address_marathi ?? null,
        address_english: profile?.address_english ?? null,
        education: profile?.education ?? null,
        occupation: profile?.occupation ?? null,
        caste_category: profile?.caste_category ?? null,
        ration_card_type: profile?.ration_card_type ?? null,
        anniversary_date: profile?.anniversary_date ?? null,
        aadhaar_masked: profile?.aadhaar_masked ?? null,
        email: profile?.email ?? null,
      };
    });

    // Filter by village, status, worker after flatten (Supabase limitation with left join filters)
    let filtered = rows;
    if (village.trim()) {
      filtered = filtered.filter(r => r.village.toLowerCase().includes(village.toLowerCase()));
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    if (workerId.trim()) {
      filtered = filtered.filter(r => r.worker_id === workerId.trim());
    }

    // App family linkage (families / family_members) — list rows are always flat; these fields clarify head vs linked members
    const pageIds = filtered.map(r => r.id).filter(Boolean) as string[];
    let enriched = filtered.map(r => ({
      ...r,
      is_family_head: false,
      family_linked_member_count: 0,
    }));
    if (pageIds.length > 0) {
      const { data: famRows } = await supabase
        .from('families')
        .select('id, head_voter_id')
        .in('head_voter_id', pageIds)
        .order('id', { ascending: true });
      const headToFamily = new Map<string, string>();
      for (const f of famRows || []) {
        const hid = f.head_voter_id as string;
        const fid = f.id as string;
        if (hid && fid && !headToFamily.has(hid)) headToFamily.set(hid, fid);
      }
      const familyIds = Array.from(new Set(headToFamily.values()));
      const memberCountByFamily: Record<string, number> = {};
      if (familyIds.length > 0) {
        const { data: memRows } = await supabase
          .from('family_members')
          .select('family_id')
          .in('family_id', familyIds);
        for (const m of memRows || []) {
          const fid = m.family_id as string;
          memberCountByFamily[fid] = (memberCountByFamily[fid] || 0) + 1;
        }
      }
      enriched = filtered.map(r => {
        const famId = headToFamily.get(r.id);
        return {
          ...r,
          is_family_head: !!famId,
          family_linked_member_count: famId ? memberCountByFamily[famId] || 0 : 0,
        };
      });
    }

    return res.json({ data: enriched, total: count || 0, page: pg, pageSize: ps });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to fetch voters' });
  }
}
