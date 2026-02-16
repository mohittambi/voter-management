import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getServiceRoleClient();
    
    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get all reports for this user
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ success: true, reports: data || [] });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to fetch reports' });
  }
}
