import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { validateConfig } from '../../../../lib/reportBuilder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
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

    const { id, name, description, config } = req.body;

    // Validate inputs
    if (!name) {
      return res.status(400).json({ error: 'Report name is required' });
    }

    if (!config) {
      return res.status(400).json({ error: 'Report configuration is required' });
    }

    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid configuration', 
        details: validation.errors 
      });
    }

    if (req.method === 'PUT' && id) {
      // Update existing report
      const { data, error } = await supabase
        .from('custom_reports')
        .update({
          name,
          description: description || null,
          config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.json({ success: true, report: data });
    } else {
      // Create new report
      const { data, error } = await supabase
        .from('custom_reports')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          config,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.json({ success: true, report: data });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to save report' });
  }
}
