import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { UserCheck, Phone, Users, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiUrl } from '../lib/api';

type AssignedVoter = {
  id: string;
  voter_id: string;
  name: string;
  mobile?: string | null;
  village?: string | null;
};

type WorkerMapping = {
  id: string;
  name: string;
  mobile?: string | null;
  assigned_count: number;
  voters: AssignedVoter[];
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchWorkers() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(apiUrl('/api/workers?view=mapping'));
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch workers');
        setWorkers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch workers');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkers();
  }, []);

  let content: ReactNode;
  if (loading) {
    content = <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading workers...</div>;
  } else if (error) {
    content = (
      <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13 }}>
        {error}
      </div>
    );
  } else if (workers.length === 0) {
    content = <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No workers found.</div>;
  } else {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workers.map(worker => {
          const isOpen = !!expanded[worker.id];
          return (
            <div key={worker.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{worker.name}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {worker.mobile ? <><Phone size={13} /> {worker.mobile}</> : 'No mobile'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 999, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> {worker.assigned_count} assigned
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpanded(prev => ({ ...prev, [worker.id]: !isOpen }))}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    {isOpen ? <><ChevronUp size={12} /> Hide Voters</> : <><ChevronDown size={12} /> Show Voters</>}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid #e2e8f0' }}>
                  {worker.voters.length === 0 ? (
                    <div style={{ padding: '14px', fontSize: 13, color: '#94a3b8' }}>No voters assigned.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Voter</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>EPIC</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Mobile</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Village</th>
                        </tr>
                      </thead>
                      <tbody>
                        {worker.voters.map((voter, idx) => (
                          <tr key={`${worker.id}-${voter.id}-${idx}`} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
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
    );
  }

  return (
    <DashboardLayout>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={20} /> Karyakarta / कार्यकर्ता
            </h2>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Worker assignment mapping list</div>
          </div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            Total: {workers.length}
          </div>
        </div>

        {content}
      </div>
    </DashboardLayout>
  );
}
