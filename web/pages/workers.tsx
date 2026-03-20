import { useEffect, useState, type ReactNode } from 'react';
import { UserCheck, Phone } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiUrl } from '../lib/api';

type Worker = {
  id: string;
  name: string;
  mobile?: string | null;
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchWorkers() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(apiUrl('/api/workers'));
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
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Name / नाव</th>
              <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>Mobile / मोबाईल</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker, i) => (
              <tr key={worker.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{worker.name}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155' }}>
                  {worker.mobile ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Phone size={13} /> {worker.mobile}</span> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Workers list</div>
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
