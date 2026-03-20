import { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServiceRoleClient();

  if (req.method === 'GET') {
    // List all service types
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  if (req.method === 'POST') {
    // Create new service type
    const { name, description, active = true, hours_to_share, hours_to_wip, display_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const payload: Record<string, unknown> = { name, description, active };
    if (hours_to_share != null) payload.hours_to_share = Number.parseInt(String(hours_to_share), 10) || 10;
    if (hours_to_wip != null) payload.hours_to_wip = Number.parseInt(String(hours_to_wip), 10) || 48;
    if (display_order != null) payload.display_order = Number.parseInt(String(display_order), 10) || null;

    const { data, error } = await supabase
      .from('service_types')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  if (req.method === 'PUT') {
    // Update service type
    const { id, name, description, active, hours_to_share, hours_to_wip, display_order } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' });
    }

    const payload: Record<string, unknown> = { name, description, active, updated_at: new Date().toISOString() };
    if (hours_to_share != null) payload.hours_to_share = Number.parseInt(String(hours_to_share), 10) || 10;
    if (hours_to_wip != null) payload.hours_to_wip = Number.parseInt(String(hours_to_wip), 10) || 48;
    if (display_order != null) payload.display_order = Number.parseInt(String(display_order), 10) || null;

    const { data, error } = await supabase
      .from('service_types')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  if (req.method === 'PATCH') {
    const { order } = req.body as { order?: string[] };
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order[] is required' });
    }

    const updates = order.map((id, idx) =>
      supabase
        .from('service_types')
        .update({ display_order: idx + 1, updated_at: new Date().toISOString() })
        .eq('id', id)
    );
    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed?.error) return res.status(500).json({ error: failed.error.message });
    return res.json({ success: true });
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
