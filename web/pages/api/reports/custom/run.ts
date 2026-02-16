import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { executeReport } from '../../../../lib/reportBuilder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Get the report
    const { data: report, error: fetchError } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Execute the report
    const result = await executeReport(supabase, report.config);

    // Update usage count and last run time
    await supabase
      .from('custom_reports')
      .update({
        usage_count: (report.usage_count || 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', id);

    return res.json({
      success: true,
      report: {
        id: report.id,
        name: report.name,
        description: report.description,
      },
      data: result.data,
      count: result.count,
      executionTime: result.executionTime,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to run report' });
  }
}
