import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { colors } from '../../lib/colors';
import {
  Plus, Crown, User, Check, Ban, Pencil, Trash2, X, Download, FileText,
  TrendingUp, Wrench, Users, BarChart3, FileDown, Settings2, CheckCircle,
  Loader,
} from 'lucide-react';

type AdminTab = 'users' | 'reports' | 'export' | 'services';

// ==================== USERS SUB-TAB ====================
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  async function updateRole(userId: string, role: string) {
    setUpdating(userId);
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, role }) });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    setUpdating(null);
  }

  async function toggleActive(userId: string, currentlyActive: boolean) {
    setUpdating(userId);
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, active: !currentlyActive }) });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentlyActive } : u));
    setUpdating(null);
  }

  const thStyle: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: colors.textSecondary, background: colors.pageBg, borderBottom: `2px solid ${colors.borderLight}` };
  const tdStyle: React.CSSProperties = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #F0F0F0', verticalAlign: 'middle' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>User Management</h3>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>वापरकर्ता व्यवस्थापन</div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ padding: '9px 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add User / वापरकर्ता जोडा
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading users... / वापरकर्ते लोड होत आहेत...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role / भूमिका</th>
                <th style={thStyle}>Status / स्थिती</th>
                <th style={thStyle}>Joined / सामील</th>
                <th style={thStyle}>Actions / क्रिया</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{u.id.slice(0, 8)}...</div>
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={u.role}
                      onChange={e => updateRole(u.id, e.target.value)}
                      disabled={updating === u.id}
                      style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white', cursor: 'pointer' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="office_user">Office User</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: u.active ? '#d1fae5' : '#fee2e2',
                      color: u.active ? '#065f46' : '#991b1b',
                    }}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: '#64748b' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => toggleActive(u.id, u.active)}
                      disabled={updating === u.id}
                      style={{
                        padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: u.active ? '#fee2e2' : '#d1fae5',
                        border: u.active ? '1px solid #fecaca' : '1px solid #bbf7d0',
                        color: u.active ? '#991b1b' : '#065f46',
                      }}
                    >
                      {updating === u.id ? '...' : u.active ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ban size={12} /> Deactivate</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Activate</span>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onCreated={fetchUsers} />}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('office_user');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onCreated(); onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 32, width: 420, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Add New User</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>नवीन वापरकर्ता जोडा</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Role / भूमिका *</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: 'white' }}>
              <option value="office_user">Office User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Create User</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== SERVICES SUB-TAB ====================
function ServicesTab() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    setLoading(true);
    const res = await fetch('/api/services');
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }

  async function toggleActive(s: any) {
    await fetch('/api/services', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, name: s.name, description: s.description, active: !s.active }),
    });
    fetchServices();
  }

  async function deleteService(id: string) {
    if (!confirm('Delete this service type? / हा सेवा प्रकार हटवायचा?')) return;
    await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
    fetchServices();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Service Types</h3>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>सेवा प्रकार व्यवस्थापन</div>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary" style={{ padding: '9px 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Service / सेवा जोडा
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading... / लोड होत आहे...</div>
        ) : services.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 10, padding: 40, textAlign: 'center', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
            No service types yet. Add one above. / अजून कोणतेही सेवा प्रकार नाहीत.
          </div>
        ) : services.map(s => (
          <div key={s.id} style={{ background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</span>
                <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: s.active ? '#d1fae5' : '#fee2e2', color: s.active ? '#065f46' : '#991b1b' }}>
                  {s.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {s.description && <div style={{ fontSize: 13, color: '#64748b' }}>{s.description}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => { setEditing(s); setShowModal(true); }} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Pencil size={12} /> Edit
              </button>
              <button onClick={() => toggleActive(s)} style={{ padding: '6px 12px', border: `1px solid ${s.active ? '#fecaca' : '#bbf7d0'}`, borderRadius: 6, background: s.active ? '#fee2e2' : '#d1fae5', color: s.active ? '#991b1b' : '#065f46', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {s.active ? <><Ban size={12} /> Deactivate</> : <><Check size={12} /> Activate</>}
              </button>
              <button onClick={() => deleteService(s.id)} style={{ padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && <ServiceModal service={editing} onClose={() => setShowModal(false)} onSaved={fetchServices} />}
    </div>
  );
}

function ServiceModal({ service, onClose, onSaved }: { service: any; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [active, setActive] = useState(service?.active !== false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/services', {
        method: service ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service?.id, name, description, active }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onSaved(); onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 28, width: 400, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{service ? 'Edit Service' : 'Add Service Type'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Name / नाव *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description / वर्णन</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="active" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Active / सक्रिय</label>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : service ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Update</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Create</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== EXPORT SUB-TAB ====================
function ExportTab() {
  const [imports, setImports] = useState<any[]>([]);
  const [importsLoading, setImportsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/imports').then(r => r.json()).then(d => { setImports(Array.isArray(d) ? d : []); setImportsLoading(false); });
  }, []);

  async function exportData(type: 'voters' | 'service_requests') {
    setDownloading(type);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export failed / निर्यात अयशस्वी: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      {/* Export buttons */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Export Data</h3>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>डेटा निर्यात करा</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button onClick={() => exportData('voters')} disabled={downloading === 'voters'} style={{
            padding: '12px 24px', border: `1px solid #90CAF9`, borderRadius: 10, background: colors.primaryLight,
            color: colors.primary, fontSize: 14, fontWeight: 700, cursor: downloading === 'voters' ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          }}>
            {downloading === 'voters' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader size={14} /> Exporting...</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Download size={14} /> Export Voters (CSV)</span>}
            <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>मतदार डेटा निर्यात करा</div>
          </button>
          <button onClick={() => exportData('service_requests')} disabled={downloading === 'service_requests'} style={{
            padding: '12px 24px', border: `1px solid #80CBC4`, borderRadius: 10, background: colors.accentLight,
            color: colors.accent, fontSize: 14, fontWeight: 700, cursor: downloading === 'service_requests' ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          }}>
            {downloading === 'service_requests' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader size={14} /> Exporting...</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Download size={14} /> Export Service Requests (CSV)</span>}
            <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>सेवा विनंत्या निर्यात करा</div>
          </button>
        </div>
      </div>

      {/* Import history */}
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Import History</h3>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>अपलोड इतिहास</div>
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {importsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading... / लोड होत आहे...</div>
          ) : imports.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No imports yet / अजून कोणतेही अपलोड नाहीत</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Filename / फाईल', 'Records / नोंदी', 'Uploaded At / अपलोड वेळ'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imports.map((imp, i) => (
                  <tr key={imp.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>
                      <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}><FileText size={13} /> {imp.filename}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: colors.primary }}>
                      {imp.record_count?.toLocaleString('en-IN') || 0}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748b' }}>
                      {new Date(imp.uploaded_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== REPORTS SUB-TAB ====================
function ReportsTab() {
  const router = useRouter();
  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Reports & Analytics</h3>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>अहवाल आणि विश्लेषण</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/reports')} style={{
          padding: '14px 24px', border: `1px solid #90CAF9`, borderRadius: 10, background: colors.primaryLight,
          color: colors.primary, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><TrendingUp size={16} /> Reports & Charts</span>
          <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>Booth, village, status, age</div>
        </button>
        <button onClick={() => router.push('/reports/builder')} style={{
          padding: '14px 24px', border: `1px solid #80CBC4`, borderRadius: 10, background: colors.accentLight,
          color: colors.accent, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Wrench size={16} /> Custom Report Builder</span>
          <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>Build and save custom reports</div>
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================
const TABS: { id: AdminTab; label: string; labelMr: string; icon: React.ReactNode }[] = [
  { id: 'users', label: 'Users', labelMr: 'वापरकर्ते', icon: <Users size={15} /> },
  { id: 'reports', label: 'Reports', labelMr: 'अहवाल', icon: <BarChart3 size={15} /> },
  { id: 'export', label: 'Export', labelMr: 'निर्यात', icon: <FileDown size={15} /> },
  { id: 'services', label: 'Services', labelMr: 'सेवा', icon: <Settings2 size={15} /> },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        {/* Sub-tab navigation */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 0, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : '2px solid transparent',
              marginBottom: -2,
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? colors.primary : colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>/ {tab.labelMr}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'export' && <ExportTab />}
        {activeTab === 'services' && <ServicesTab />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
