import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Report ID is required' });
    }

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

    // Delete the report
    const { error } = await supabase
      .from('custom_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to delete report' });
  }
}
