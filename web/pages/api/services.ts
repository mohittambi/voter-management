import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    // List all service types
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  if (req.method === 'POST') {
    // Create new service type
    const { name, description, active = true } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { data, error } = await supabase
      .from('service_types')
      .insert({ name, description, active })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  if (req.method === 'PUT') {
    // Update service type
    const { id, name, description, active } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' });
    }

    const { data, error } = await supabase
      .from('service_types')
      .update({ name, description, active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  if (req.method === 'DELETE') {
    // Delete service type
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const { error } = await supabase
      .from('service_types')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
