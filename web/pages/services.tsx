import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Wrench, Plus, ClipboardList, Pencil, Trash2, AlertTriangle, Save, Loader } from 'lucide-react';
import { apiUrl } from '../lib/api';

interface ServiceType {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch(apiUrl('/api/services'));
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingService(null);
    setShowAddModal(true);
  }

  function openEditModal(service: ServiceType) {
    setEditingService(service);
    setShowAddModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service type?')) return;

    try {
      const res = await fetch(apiUrl(`/api/services?id=${id}`), { method: 'DELETE' });
      if (res.ok) {
        await fetchServices();
      } else {
        alert('Failed to delete service');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting service');
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24 
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wrench size={26} /> Service Types
              </h1>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
                Manage service types for voter requests
              </p>
            </div>
            <button onClick={openAddModal} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Service Type
            </button>
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b', margin: 0 }}>Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><ClipboardList size={64} color="#94a3b8" /></div>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>No Service Types</h2>
              <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
                Create your first service type to get started
              </p>
              <button onClick={openAddModal} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Add Service Type
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {services.map(service => (
                <div key={service.id} className="card" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center' 
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                        {service.name}
                      </h3>
                      {service.active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-neutral">Inactive</span>
                      )}
                    </div>
                    {service.description && (
                      <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
                        {service.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => openEditModal(service)}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="btn-danger"
                      style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddModal && (
          <ServiceModal
            service={editingService}
            onClose={() => {
              setShowAddModal(false);
              setEditingService(null);
            }}
            onSuccess={() => {
              setShowAddModal(false);
              setEditingService(null);
              fetchServices();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function ServiceModal({ 
  service, 
  onClose, 
  onSuccess 
}: { 
  service: ServiceType | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [active, setActive] = useState(service?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/services'), {
        method: service ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: service?.id,
          name, 
          description, 
          active 
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save service');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            {service ? <><Pencil size={18} /> Edit Service Type</> : <><Plus size={18} /> Add Service Type</>}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Service Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="e.g., Ration Card, Aadhaar Update"
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Brief description of this service type"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
              />
              <span className="label" style={{ margin: 0 }}>Active</span>
            </label>
            <p style={{ margin: '4px 0 0 28px', fontSize: 13, color: '#64748b' }}>
              Only active service types can be selected for new requests
            </p>
          </div>

          {error && (
            <div style={{
              padding: 12,
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#991b1b',
              fontSize: 14,
              marginBottom: 20
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> {error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader size={14} /> Saving...</span> : service ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Save size={14} /> Update</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Save size={14} /> Create</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
