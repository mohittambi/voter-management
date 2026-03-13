import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { type = 'voters' } = req.query as Record<string, string>;
  const supabase = getServiceRoleClient();

  try {
    if (type === 'voters') {
      const { data, error } = await supabase
        .from('master_voters')
        .select(`
          voter_id, first_name, middle_name, surname, name_english, name_marathi, surname_marathi,
          booth_number, serial_number, age, gender, caste, assembly_constituency,
          voter_profiles!left(mobile, mobile_secondary, status, village, address_marathi,
            workers(name, mobile), employees(name, employee_id), villages(name, new_gan, new_gat))
        `)
        .order('serial_number', { ascending: true });

      if (error) throw error;

      const header = [
        'Voter ID', 'First Name', 'Middle Name', 'Surname', 'Full Name (English)', 'Full Name (Marathi)',
        'Booth', 'Serial No.', 'Age', 'Gender', 'Caste', 'Assembly Constituency',
        'Mobile', 'Mobile 2', 'Status', 'Village', 'Address (Marathi)',
        'Staff', 'Staff Mobile', 'Employee', 'Employee ID',
      ].join(',');

      const rows = (data || []).map((v: any) => {
        const p = Array.isArray(v.voter_profiles) ? v.voter_profiles[0] : v.voter_profiles;
        const w = p?.workers;
        const e = p?.employees;
        const fields = [
          v.voter_id, v.first_name, v.middle_name, v.surname, v.name_english, v.name_marathi,
          v.booth_number, v.serial_number, v.age, v.gender, v.caste, v.assembly_constituency,
          p?.mobile, p?.mobile_secondary, p?.status, p?.village, p?.address_marathi,
          w?.name, w?.mobile, e?.name, e?.employee_id,
        ].map(f => `"${String(f ?? '').replace(/"/g, '""')}"`);
        return fields.join(',');
      });

      const csv = '\uFEFF' + header + '\n' + rows.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="voters-export-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    if (type === 'service_requests') {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id, status, notes, created_at, updated_at, created_by,
          master_voters(voter_id, name_english, name_marathi, first_name, surname, voter_profiles(mobile, village)),
          service_types(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const header = [
        'Request ID', 'Status', 'Voter ID', 'Voter Name (English)', 'Voter Name (Marathi)',
        'Village', 'Mobile', 'Service Type', 'Notes', 'Created By', 'Date Raised', 'Last Updated',
      ].join(',');

      const rows = (data || []).map((r: any) => {
        const v = r.master_voters;
        const p = Array.isArray(v?.voter_profiles) ? v.voter_profiles[0] : v?.voter_profiles;
        const fields = [
          r.id, r.status,
          v?.voter_id, v?.name_english || `${v?.first_name || ''} ${v?.surname || ''}`.trim(), v?.name_marathi,
          p?.village, p?.mobile, r.service_types?.name, r.notes, r.created_by,
          new Date(r.created_at).toLocaleDateString('en-IN'),
          new Date(r.updated_at).toLocaleDateString('en-IN'),
        ].map(f => `"${String(f ?? '').replace(/"/g, '""')}"`);
        return fields.join(',');
      });

      const csv = '\uFEFF' + header + '\n' + rows.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="service-requests-export-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    return res.status(400).json({ error: 'Invalid type. Use: voters | service_requests' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
}
