import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getAdmin();

  if (req.method === 'GET') {
    const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) return res.status(500).json({ error: authErr.message });

    const { data: roles } = await supabase.from('user_roles').select('user_id, role, active, created_at');
    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r]));

    const result = users.map(u => {
      const roleRow = roleMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        role: roleRow?.role || 'office_user',
        active: roleRow?.active !== false,
        created_at: u.created_at,
        role_created_at: roleRow?.created_at,
      };
    });

    return res.json(result);
  }

  if (req.method === 'POST') {
    const { email, password, role = 'office_user' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authErr) return res.status(500).json({ error: authErr.message });

    const { error: roleErr } = await supabase.from('user_roles').insert({ user_id: authData.user.id, role });
    if (roleErr) return res.status(500).json({ error: roleErr.message });

    return res.status(201).json({ user: authData.user });
  }

  if (req.method === 'PATCH') {
    const { user_id, role, active } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const updates: Record<string, any> = {};
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('user_roles').update(updates).eq('user_id', user_id);
      if (error) return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
