import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AVAILABLE_FIELDS, OPERATORS, ReportConfig, ReportFilter, convertToCSV } from '../../lib/reportBuilder';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClipboardList, Search, ArrowUpDown, Eye, Wrench, Download, Save, FolderOpen,
  Trash2, Plus, X, Loader,
} from 'lucide-react';

type Step = 'fields' | 'filters' | 'sort' | 'preview';

export default function ReportBuilder() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('fields');
  const [config, setConfig] = useState<ReportConfig>({
    fields: [],
    filters: [],
    sortBy: undefined,
    limit: 100,
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    fetchSavedReports();
  }, []);

  async function fetchSavedReports() {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/reports/custom/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function getAuthToken() {
    // Get the user's session token
    const session = await fetch('/api/auth/session').then(r => r.json()).catch(() => null);
    return session?.access_token || null;
  }

  function toggleField(field: string) {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field],
    }));
  }

  function addFilter() {
    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { field: '', operator: '=', value: '' }],
    }));
  }

  function updateFilter(index: number, updates: Partial<ReportFilter>) {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    }));
  }

  function removeFilter(index: number) {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  }

  async function generatePreview() {
    if (config.fields.length === 0) {
      alert('Please select at least one field');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/reports/custom/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, limit: 10 }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate preview');
      }

      const data = await res.json();
      setPreviewData(data.data || []);
      setPreviewCount(data.count || 0);
      setCurrentStep('preview');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveReport() {
    if (!reportName) {
      alert('Please enter a report name');
      return;
    }

    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to save reports');
        return;
      }

      const res = await fetch('/api/reports/custom/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          config,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save report');
      }

      alert('✅ Report saved successfully!');
      setShowSaveDialog(false);
      fetchSavedReports();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(reportId: string) {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/reports/custom/run?id=${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const report = savedReports.find(r => r.id === reportId);
        if (report) {
          setConfig(report.config);
          setReportName(report.name);
          setReportDescription(report.description || '');
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteReport(reportId: string) {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/reports/custom/delete?id=${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('✅ Report deleted successfully');
        fetchSavedReports();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function exportToCSV() {
    const csv = convertToCSV(previewData, config.fields);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const steps = [
    { id: 'fields', label: 'Select Fields', icon: <ClipboardList size={16} /> },
    { id: 'filters', label: 'Add Filters', icon: <Search size={16} /> },
    { id: 'sort', label: 'Sort & Limit', icon: <ArrowUpDown size={16} /> },
    { id: 'preview', label: 'Preview & Export', icon: <Eye size={16} /> },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wrench size={28} /> Custom Report Builder
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
              Create custom reports with your own fields, filters, and sorting
            </p>
          </div>

          {/* Progress Steps */}
          <div className="card" style={{ marginBottom: 24, padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              {steps.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id as Step)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: isActive ? '#3b82f6' : isCompleted ? '#10b981' : '#f1f5f9',
                      color: isActive || isCompleted ? 'white' : '#64748b',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center' }}>{step.icon}</span>
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1: Select Fields */}
          {currentStep === 'fields' && (
            <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} /> Step 1: Select Fields to Include
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                {/* Master Voters Fields */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                    Master Voter Fields
                  </h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {AVAILABLE_FIELDS.master_voters.map(field => (
                      <label
                        key={field.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: 10,
                          background: config.fields.includes(field.key) ? '#dbeafe' : '#f8fafc',
                          borderRadius: 6,
                          cursor: 'pointer',
                          border: config.fields.includes(field.key) ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={config.fields.includes(field.key)}
                          onChange={() => toggleField(field.key)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 14, color: '#0f172a' }}>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Voter Profile Fields */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                    Voter Profile Fields
                  </h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {AVAILABLE_FIELDS.voter_profiles.map(field => (
                      <label
                        key={field.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: 10,
                          background: config.fields.includes(field.key) ? '#dbeafe' : '#f8fafc',
                          borderRadius: 6,
                          cursor: 'pointer',
                          border: config.fields.includes(field.key) ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={config.fields.includes(field.key)}
                          onChange={() => toggleField(field.key)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 14, color: '#0f172a' }}>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, color: '#64748b' }}>
                  Selected: <strong>{config.fields.length}</strong> fields
                </p>
                <button
                  onClick={() => setCurrentStep('filters')}
                  disabled={config.fields.length === 0}
                  className="btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Next: Add Filters →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Filters */}
          {currentStep === 'filters' && (
            <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={18} /> Step 2: Add Filters (Optional)
              </h3>

              {config.filters.map((filter, idx) => (
                <div key={idx} style={{ marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr auto', gap: 12, alignItems: 'end' }}>
                    <div>
                      <label className="label">Field</label>
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(idx, { field: e.target.value })}
                        className="input"
                      >
                        <option value="">Select field...</option>
                        {[...AVAILABLE_FIELDS.master_voters, ...AVAILABLE_FIELDS.voter_profiles].map(field => (
                          <option key={field.key} value={field.key}>{field.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Operator</label>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(idx, { operator: e.target.value as any })}
                        className="input"
                      >
                        {OPERATORS.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Value</label>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(idx, { value: e.target.value })}
                        className="input"
                        placeholder="Enter value..."
                      />
                    </div>

                    <button
                      onClick={() => removeFilter(idx)}
                    className="btn-secondary"
                    style={{ padding: '10px 16px', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addFilter}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', marginBottom: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Plus size={14} /> Add Filter
              </button>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setCurrentStep('fields')} className="btn-secondary">
                  ← Back
                </button>
                <button onClick={() => setCurrentStep('sort')} className="btn-primary">
                  Next: Sort & Limit →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Sort & Limit */}
          {currentStep === 'sort' && (
            <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowUpDown size={18} /> Step 3: Configure Sort & Limit
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>
                <div>
                  <label className="label">Sort By</label>
                  <select
                    value={config.sortBy?.field || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sortBy: e.target.value ? { field: e.target.value, order: prev.sortBy?.order || 'asc' } : undefined
                    }))}
                    className="input"
                  >
                    <option value="">No sorting</option>
                    {config.fields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Sort Order</label>
                  <select
                    value={config.sortBy?.order || 'asc'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sortBy: prev.sortBy ? { ...prev.sortBy, order: e.target.value as 'asc' | 'desc' } : undefined
                    }))}
                    className="input"
                    disabled={!config.sortBy?.field}
                  >
                    <option value="asc">Ascending (A-Z, 0-9)</option>
                    <option value="desc">Descending (Z-A, 9-0)</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Limit Results</label>
                  <input
                    type="number"
                    value={config.limit || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 100 }))}
                    className="input"
                    min="1"
                    max="10000"
                    placeholder="100"
                  />
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Maximum 10,000 rows
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => setCurrentStep('filters')} className="btn-secondary">
                  ← Back
                </button>
                <button onClick={generatePreview} disabled={loading} className="btn-primary">
                  {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader size={14} /> Generating...</span> : 'Generate Preview →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Export */}
          {currentStep === 'preview' && (
            <div className="card">
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} /> Step 4: Preview & Export
              </h3>

              <div style={{ marginBottom: 20, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                <p style={{ margin: 0, fontSize: 14, color: '#0c4a6e' }}>
                  <strong>Total Results:</strong> {previewCount} rows | <strong>Showing:</strong> First {Math.min(10, previewData.length)} rows
                </p>
              </div>

              {previewData.length > 0 ? (
                <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        {config.fields.map(field => (
                          <th key={field} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {config.fields.map(field => (
                            <td key={field} style={{ padding: '12px 16px', color: '#0f172a' }}>
                              {row[field] || row.voter_profiles?.[field] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
                  No data found matching your criteria
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentStep('sort')} className="btn-secondary">
                  ← Back
                </button>
                <button onClick={exportToCSV} disabled={previewData.length === 0} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Download size={14} /> Export to CSV
                </button>
                <button onClick={() => setShowSaveDialog(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Save size={14} /> Save Report
                </button>
              </div>
            </div>
          )}

          {/* Saved Reports Section */}
          {savedReports.length > 0 && (
            <div className="card" style={{ marginTop: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderOpen size={18} /> Your Saved Reports
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {savedReports.map(report => (
                  <div key={report.id} style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                          {report.name}
                        </h4>
                        {report.description && (
                          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b' }}>{report.description}</p>
                        )}
                        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                          Created: {new Date(report.created_at).toLocaleDateString()} | 
                          Used: {report.usage_count} times
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => loadReport(report.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <FolderOpen size={13} /> Load
                        </button>
                        <button onClick={() => deleteReport(report.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', display: 'inline-flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Dialog */}
          {showSaveDialog && (
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
              zIndex: 1000
            }}>
              <div className="card" style={{ maxWidth: 500, width: '90%' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={18} /> Save Custom Report
                </h3>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Report Name *</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="input"
                    placeholder="e.g., Active Voters by Booth"
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Description (Optional)</label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Brief description of what this report shows..."
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowSaveDialog(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={saveReport} disabled={loading || !reportName} className="btn-primary">
                    {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader size={14} /> Saving...</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Save size={14} /> Save Report</span>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
