import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = (req.query.q as string) || '';
  const booth = req.query.booth as string;
  const status = req.query.status as string;
  const village = req.query.village as string;
  
  if (!q && !booth && !status && !village) return res.json([]);
  
  try {
    const supabase = getServiceRoleClient();
    
    // Build query
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
        surname_marathi,
        booth_number,
        caste,
        age,
        gender,
        voter_profiles(mobile, status, village, address_marathi)
      `);

    // Search by text (supports both Marathi and English)
    if (q) {
      query = query.or(`first_name.ilike.%${q}%,middle_name.ilike.%${q}%,surname.ilike.%${q}%,voter_id.ilike.%${q}%,name_marathi.ilike.%${q}%,name_english.ilike.%${q}%,surname_marathi.ilike.%${q}%`);
    }

    // Filter by booth
    if (booth) {
      query = query.eq('booth_number', parseInt(booth));
    }

    // Filter by status
    if (status) {
      query = query.eq('voter_profiles.status', status);
    }

    // Filter by village
    if (village) {
      query = query.eq('voter_profiles.village', village);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    // Flatten the nested voter_profiles
    const results = (data || []).map((voter: any) => ({
      id: voter.id,
      first_name: voter.first_name,
      middle_name: voter.middle_name,
      surname: voter.surname,
      voter_id: voter.voter_id,
      name_marathi: voter.name_marathi,
      name_english: voter.name_english,
      surname_marathi: voter.surname_marathi,
      booth_number: voter.booth_number,
      caste: voter.caste,
      age: voter.age,
      gender: voter.gender,
      mobile: voter.voter_profiles?.mobile,
      status: voter.voter_profiles?.status,
      village: voter.voter_profiles?.village,
      address_marathi: voter.voter_profiles?.address_marathi,
    }));

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'search failed' });
  }
}
