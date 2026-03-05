import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Upload, FolderOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function UploadPage() {
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imported, setImported] = useState(0);
  const [familiesCreated, setFamiliesCreated] = useState(0);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImported(data.imported);
        setFamiliesCreated(data.families_created || 0);
        setSuccess(true);
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || 'unknown error'}`);
      }
    } catch (error) {
      alert('Upload failed: ' + error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          maxWidth: 600,
          margin: '0 auto'
        }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Upload size={64} color="#0D47A1" /></div>
          <h3 style={{ margin: 0, fontSize: 24, color: '#1f2937' }}>मतदार यादी अपलोड करा / Upload Voter List</h3>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>Excel (Manoli.xlsx format) किंवा CSV फाइल अपलोड करा</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
            Supports: .xlsx, .xls, .csv | Auto-links families | Marathi names supported
          </p>
        </div>

          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            background: '#f9fafb',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              disabled={uploading}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
              {!uploading && !success && (
                <>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><FolderOpen size={48} color="#94a3b8" /></div>
                  <p style={{ margin: 0, fontSize: 16, color: '#1f2937', fontWeight: 500 }}>
                    Click to select file or drag and drop
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
                    Supports .xlsx, .xls, .csv
                  </p>
                </>
              )}
              {uploading && (
                <>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Loader2 size={48} color="#3b82f6" /></div>
                  <p style={{ margin: 0, fontSize: 16, color: '#3b82f6', fontWeight: 500 }}>
                    Uploading {fileName}...
                  </p>
                </>
              )}
            {success && !uploading && (
              <>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={48} color="#10b981" /></div>
                <p style={{ margin: 0, fontSize: 16, color: '#10b981', fontWeight: 500 }}>
                  अपलोड यशस्वी! / Upload successful!
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
                  {imported} मतदार आयात केले / {imported} voters imported from {fileName}
                </p>
                {familiesCreated > 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
                    {familiesCreated} कुटुंबे तयार केली / {familiesCreated} families auto-linked
                  </p>
                )}
              </>
            )}
            </label>
          </div>

          {success && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                onClick={() => {
                  setSuccess(false);
                  setFileName('');
                }}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Upload Another File
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

