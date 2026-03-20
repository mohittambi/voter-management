import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiUrl } from '../lib/api';
import { supabase } from '../contexts/AuthContext';

type Employee = {
  id: string;
  name: string;
  employee_id: string;
  assigned_count?: number;
  voters?: AssignedVoter[];
};

type AssignedVoter = {
  id: string;
  voter_id: string;
  name: string;
  mobile?: string | null;
  village?: string | null;
};

function EmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(employee?.name || '');
  const [employeeId, setEmployeeId] = useState(employee?.employee_id || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(apiUrl('/api/admin/employees'), {
        method: employee ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(
          employee
            ? { id: employee.id, name, employee_id: employeeId }
            : { name, employee_id: employeeId }
        ),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Request failed');

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 28, width: 400, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{employee ? 'Edit Employee' : 'Add Employee'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Name / नाव *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Employee ID *</label>
            <input value={employeeId} onChange={e => setEmployeeId(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={14} /> {employee ? 'Update' : 'Create'}</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function fetchEmployees() {
    setLoading(true);
    const res = await fetch(apiUrl('/api/admin/employees?view=mapping'));
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function deleteEmployee(id: string) {
    if (!confirm('Delete this employee? / हा कर्मचारी हटवायचा?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(apiUrl(`/api/admin/employees?id=${id}`), {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) fetchEmployees();
    else alert('Delete failed / हटवणे अयशस्वी');
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Employees / कर्मचारी</h3>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Karamchari CRUD - paid staff</div>
            </div>
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary" style={{ padding: '9px 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Employee / कर्मचारी जोडा
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading... / लोड होत आहे...</div>
            ) : employees.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No employees yet. Add one above. / अजून कोणतेही कर्मचारी नाहीत.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Name / नाव</th>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Employee ID</th>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Assigned Voters</th>
                    <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Actions / क्रिया</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={emp.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>{emp.name}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontFamily: 'monospace' }}>{emp.employee_id}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: '#1d4ed8', fontWeight: 700 }}>{emp.assigned_count ?? 0}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditing(emp); setShowModal(true); }} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => deleteEmployee(emp.id)} style={{ padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {employees.map(emp => {
              const voters = emp.voters || [];
              const isOpen = !!expanded[emp.id];
              return (
                <div key={`map-${emp.id}`} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {emp.name} <span style={{ fontFamily: 'monospace', fontWeight: 500, color: '#64748b' }}>({emp.employee_id})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpanded(prev => ({ ...prev, [emp.id]: !isOpen }))}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      {isOpen ? 'Hide Mapping' : `Show Mapping (${voters.length})`}
                    </button>
                  </div>
                  {isOpen && (
                    <div>
                      {voters.length === 0 ? (
                        <div style={{ padding: 14, fontSize: 13, color: '#94a3b8' }}>No voters assigned.</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>Voter</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>EPIC</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>Mobile</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>Village</th>
                            </tr>
                          </thead>
                          <tbody>
                            {voters.map((voter, idx) => (
                              <tr key={`${emp.id}-${voter.id}-${idx}`} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
                                  <Link href={`/voter/${voter.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>{voter.name || 'Unnamed voter'}</Link>
                                </td>
                                <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>{voter.voter_id || '—'}</td>
                                <td style={{ padding: '10px 14px', fontSize: 13, color: '#334155' }}>{voter.mobile || '—'}</td>
                                <td style={{ padding: '10px 14px', fontSize: 13, color: '#334155' }}>{voter.village || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showModal && <EmployeeModal employee={editing} onClose={() => setShowModal(false)} onSaved={fetchEmployees} />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
