import { useEffect, useState } from 'react';
import { getAnonClient } from '../lib/supabaseClient';
import { apiUrl } from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import { Loader2, AlertTriangle, FolderOpen, FileText, Download } from 'lucide-react';

export default function ImportsPage() {
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/imports'))
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch imports');
        return r.json();
      })
      .then(d => {
        setImports(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function downloadFile(storagePath: string, filename: string) {
    const supabase = getAnonClient();
    const { data, error } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'imports')
      .download(storagePath);
    if (error) {
      alert('Download failed: ' + error.message);
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return (
    <DashboardLayout>
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Loader2 size={48} color="#94a3b8" /></div>
        <p style={{ margin: 0, color: '#64748b' }}>Loading imports...</p>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><AlertTriangle size={48} color="#ef4444" /></div>
        <p style={{ margin: 0, color: '#ef4444', fontWeight: 600 }}>Error: {error}</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="card fade-in">
        {imports.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><FolderOpen size={64} color="#94a3b8" /></div>
            <h3 style={{ margin: 0, fontSize: 20, color: '#0f172a', fontWeight: 600 }}>No imports yet</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b' }}>Upload your first voter list to get started!</p>
          </div>
        )}
        {imports.length > 0 && (
          <>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Import History</h3>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
                  {imports.length} import{imports.length !== 1 ? 's' : ''} total
                </p>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Uploaded At</th>
                  <th style={{ textAlign: 'center' }}>Records</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {imports.map(imp => (
                  <tr key={imp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: '#dbeafe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <FileText size={18} color="#3b82f6" />
                        </div>
                        <span style={{ fontWeight: 600 }}>{imp.filename}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{new Date(imp.uploaded_at).toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-info">{imp.record_count}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {imp.storage_path && (
                        <button
                          onClick={() => downloadFile(imp.storage_path, imp.filename)}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Download size={13} /> Download</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
