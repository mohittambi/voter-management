import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { executeReport, validateConfig, ReportConfig } from '../../../../lib/reportBuilder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config: ReportConfig = req.body;
    
    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid configuration', 
        details: validation.errors 
      });
    }

    const supabase = getServiceRoleClient();
    
    // Execute the report
    const result = await executeReport(supabase, config);
    
    return res.json({
      success: true,
      data: result.data,
      count: result.count,
      executionTime: result.executionTime,
      message: `Report generated successfully in ${result.executionTime}ms`
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to build report' });
  }
}
