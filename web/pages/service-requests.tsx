import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import NewRequestModal from '../components/NewRequestModal';
import StatusHistoryModal from '../components/StatusHistoryModal';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../contexts/AuthContext';
import { colors, SR_STATUS_CONFIG } from '../lib/colors';
import { apiUrl } from '../lib/api';
import { X, SlidersHorizontal, Plus, MessageCircle, Clock, AlertTriangle, FileDown } from 'lucide-react';

const SR_STATUSES = [
  'Document Submitted',
  'Document Shared to Office',
  'Work in Progress',
  'Work Completed',
  'Closed / Delivered',
];

const STATUS_STYLES = SR_STATUS_CONFIG;

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const s = STATUS_STYLES[status] || { bg: colors.pageBg, color: colors.textSecondary, border: colors.borderLight };
  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      style={{
        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap',
        ...(onClick ? { cursor: 'pointer', userSelect: 'none' } : {}),
      }}
    >
      {status}
    </span>
  );
}

function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: '4px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} style={{ height: 14, flex: j === 1 ? 2 : 1, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const [showNewModal, setShowNewModal] = useState(false);
  const [historyRequestId, setHistoryRequestId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusOverlayRequestId, setStatusOverlayRequestId] = useState<string | null>(null);
  const [statusOverlayDraft, setStatusOverlayDraft] = useState<string>('');

  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/services')).then(r => r.json()).then(d => setServiceTypes(d));
  }, []);

  const fetchRequests = useCallback(async (overrides: Record<string, any> = {}) => {
    setLoading(true); setError(null);
    const params = new URLSearchParams({
      page: String(overrides.page ?? page),
      pageSize: String(pageSize),
      q: overrides.q ?? q,
      status: overrides.status ?? statusFilter,
      service_type: overrides.service_type ?? serviceTypeFilter,
      village: overrides.village ?? villageFilter,
      date_from: overrides.date_from ?? dateFrom,
      date_to: overrides.date_to ?? dateTo,
    });
    try {
      const res = await fetch(apiUrl(`/api/service-requests?${params}`));
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      setRequests(d.data || []);
      setTotal(d.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, statusFilter, serviceTypeFilter, villageFilter, dateFrom, dateTo]);

  useEffect(() => { fetchRequests(); }, [page]);
  useEffect(() => { fetchRequests(); }, []); // initial

  function handleSearchChange(val: string) {
    setQ(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(1); fetchRequests({ page: 1, q: val }); }, 400);
  }

  function handleFilterChange(key: string, val: string) {
    const setters: Record<string, (v: string) => void> = {
      status: setStatusFilter, service_type: setServiceTypeFilter,
      village: setVillageFilter, date_from: setDateFrom, date_to: setDateTo,
    };
    setters[key]?.(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(1); fetchRequests({ page: 1, [key]: val }); }, 400);
  }

  async function updateStatus(requestId: string, newStatus: string) {
    setStatusUpdating(requestId);
    setStatusOverlayRequestId(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(apiUrl(`/api/service-requests/${requestId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    } catch (e: any) {
      alert(`Error / त्रुटी: ${e.message}`);
    } finally {
      setStatusUpdating(null);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setStatusOverlayRequestId(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function whatsappUrl(mobile: string, voterName: string, serviceType: string, status: string) {
    const m = mobile.replace(/\D/g, '');
    const phone = m.startsWith('91') ? m : `91${m}`;
    const text = encodeURIComponent(`नमस्कार ${voterName} जी,\nआपल्या "${serviceType}" सेवा विनंतीची सद्यस्थिती:\n*${status}*\nधन्यवाद.`);
    return `https://wa.me/${phone}?text=${text}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = !!(q || statusFilter || serviceTypeFilter || villageFilter || dateFrom || dateTo);

  const thStyle: React.CSSProperties = {
    padding: '11px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700,
    color: colors.textSecondary, background: colors.pageBg, borderBottom: `2px solid ${colors.borderLight}`, whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: 13, color: colors.textPrimary,
    borderBottom: `1px solid #F0F0F0`, verticalAlign: 'middle',
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              value={q}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by voter name, voter ID, request ID / नाव, ID शोधा..."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
          </div>
          <button onClick={() => setShowFilters(f => !f)} style={{
            padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 8,
            background: showFilters ? '#ede9fe' : 'white', color: showFilters ? '#6d28d9' : '#374151',
            fontSize: 14, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><SlidersHorizontal size={14} /> Filters {hasFilters ? `(active)` : ''}</span>
          </button>
          <button onClick={() => setShowNewModal(true)} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> New Request / नवीन विनंती</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Status / स्थिती</label>
              <select value={statusFilter} onChange={e => handleFilterChange('status', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white' }}>
                <option value="">All statuses</option>
                {SR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Service Type / सेवा प्रकार</label>
              <select value={serviceTypeFilter} onChange={e => handleFilterChange('service_type', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white' }}>
                <option value="">All types</option>
                {serviceTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Village / गाव</label>
              <input value={villageFilter} onChange={e => handleFilterChange('village', e.target.value)} placeholder="Village name" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Date From / तारीख पासून</label>
              <input type="date" value={dateFrom} onChange={e => handleFilterChange('date_from', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Date To / तारीख पर्यंत</label>
              <input type="date" value={dateTo} onChange={e => handleFilterChange('date_to', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            {hasFilters && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => {
                  setStatusFilter(''); setServiceTypeFilter(''); setVillageFilter('');
                  setDateFrom(''); setDateTo(''); setQ('');
                  setPage(1); fetchRequests({ page: 1, q: '', status: '', service_type: '', village: '', date_from: '', date_to: '' });
                }} style={{ width: '100%', padding: '8px 10px', border: '1px solid #fecaca', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={12} /> Clear All</span>
                </button>
              </div>
            )}
          </div>
        )}

        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#991b1b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> {error}</div>}

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 14, color: '#475569', fontWeight: 500 }}>
            {loading ? 'Loading...' : `${total.toLocaleString('en-IN')} requests / विनंत्या`}
          </div>

          {/* Desktop table */}
          <div style={{ overflowX: 'auto' }} className="table-desktop">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Request ID</th>
                  <th style={thStyle}>Voter / मतदार</th>
                  <th style={thStyle}>Village / गाव</th>
                  <th style={thStyle}>Service Type / सेवा प्रकार</th>
                  <th style={thStyle}>Status / स्थिती</th>
                  <th style={thStyle}>Date Raised / तारीख</th>
                  <th style={thStyle}>Last Updated</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 0 }}><Skeleton /></td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    No service requests found / कोणत्याही सेवा विनंत्या सापडल्या नाही
                  </td></tr>
                ) : requests.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{r.id.slice(0, 8)}...</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.voter_name_english}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'serif' }}>{r.voter_name_marathi}</div>
                      <div style={{ fontSize: 11, color: '#2563eb', fontFamily: 'monospace', marginTop: 2 }}>{r.voter_epic}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#64748b' }}>{r.village || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: 13, maxWidth: 160 }}>{r.service_type_name}</td>
                    <td style={{ ...tdStyle, position: 'relative' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <StatusBadge
                          status={r.status}
                          onClick={() => {
                            setStatusOverlayRequestId(r.id);
                            setStatusOverlayDraft(r.status);
                          }}
                        />
                        {statusOverlayRequestId === r.id && (
                          <>
                            <div onClick={() => setStatusOverlayRequestId(null)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                            <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 51, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 12, minWidth: 220 }}>
                              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>New status / नवीन स्थिती</label>
                              <select value={statusOverlayDraft} onChange={e => setStatusOverlayDraft(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, background: 'white', marginBottom: 10 }}>
                                {SR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button onClick={() => updateStatus(r.id, statusOverlayDraft)} disabled={statusUpdating === r.id} className="btn-primary" style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}>
                                {statusUpdating === r.id ? 'Updating...' : 'Update Status / स्थिती अपडेट करा'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(r.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={e => { e.stopPropagation(); window.open(apiUrl(`/api/service-requests/${r.id}/pdf`), '_blank', 'noopener'); }} title="Download PDF" style={{
                          width: 30, height: 30, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><FileDown size={15} color="#059669" /></button>
                        {r.mobile && (
                          <a href={whatsappUrl(r.mobile, r.voter_name_english, r.service_type_name, r.status)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="WhatsApp" style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 30, height: 30, borderRadius: 6, background: '#dcfce7', border: '1px solid #bbf7d0',
                            textDecoration: 'none',
                          }}><MessageCircle size={15} /></a>
                        )}
                        <button onClick={() => setHistoryRequestId(r.id)} title="View status history / स्थिती इतिहास पहा" style={{
                          width: 30, height: 30, borderRadius: 6, background: '#f0f9ff', border: '1px solid #bae6fd',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Clock size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="table-mobile" style={{ display: 'none' }}>
            {loading ? <Skeleton rows={5} /> : requests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No requests found / कोणत्याही विनंत्या सापडल्या नाही</div>
            ) : requests.map(r => (
              <div key={r.id} style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{r.voter_name_english}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.service_type_name}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <StatusBadge status={r.status} onClick={() => { setExpandedRow(r.id); setStatusOverlayRequestId(r.id); setStatusOverlayDraft(r.status); }} />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={e => { e.stopPropagation(); window.open(apiUrl(`/api/service-requests/${r.id}/pdf`), '_blank', 'noopener'); }} title="Download PDF" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}><FileDown size={18} color="#059669" /></button>
                      {r.mobile && (
                        <a href={whatsappUrl(r.mobile, r.voter_name_english, r.service_type_name, r.status)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}><MessageCircle size={20} color="#16a34a" /></a>
                      )}
                    </div>
                  </div>
                </div>
                {(expandedRow === r.id || statusOverlayRequestId === r.id) && (
                  <div style={{ marginTop: 10, padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 13 }}>
                    <div style={{ marginBottom: 6 }}><span style={{ color: '#94a3b8' }}>Voter ID: </span><span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{r.voter_epic}</span></div>
                    <div style={{ marginBottom: 6 }}><span style={{ color: '#94a3b8' }}>Village: </span>{r.village || '—'}</div>
                    <div style={{ marginBottom: 6 }}><span style={{ color: '#94a3b8' }}>Raised: </span>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                    <div style={{ marginBottom: 10 }}><span style={{ color: '#94a3b8' }}>Notes: </span>{r.notes || '—'}</div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Update Status:</label>
                      {statusOverlayRequestId === r.id ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select value={statusOverlayDraft} onChange={e => setStatusOverlayDraft(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 13 }}>
                            {SR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => updateStatus(r.id, statusOverlayDraft)} disabled={statusUpdating === r.id} className="btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>{statusUpdating === r.id ? '...' : 'Update'}</button>
                          <button onClick={() => setStatusOverlayRequestId(null)} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <StatusBadge status={r.status} onClick={() => { setStatusOverlayRequestId(r.id); setStatusOverlayDraft(r.status); }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={e => { e.stopPropagation(); window.open(apiUrl(`/api/service-requests/${r.id}/pdf`), '_blank', 'noopener'); }} style={{ flex: 1, padding: '8px', border: '1px solid #bbf7d0', borderRadius: 6, background: '#f0fdf4', color: '#059669', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <FileDown size={13} /> PDF
                      </button>
                      <button onClick={() => setHistoryRequestId(r.id)} style={{ flex: 1, padding: '8px', border: '1px solid #bae6fd', borderRadius: 6, background: '#f0f9ff', color: '#0369a1', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Clock size={13} /> History
                      </button>
                    </div>
                  </div>
                )}
                <button onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)} style={{ marginTop: 8, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                  {expandedRow === r.id ? '▲ Less' : '▼ More details'}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {totalPages}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>‹ Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>Next ›</button>
              </div>
            </div>
          )}
        </div>

        {showNewModal && <NewRequestModal onClose={() => setShowNewModal(false)} onCreated={fetchRequests} />}
        {historyRequestId && <StatusHistoryModal requestId={historyRequestId} onClose={() => setHistoryRequestId(null)} />}

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          @media (max-width: 768px) {
            .table-desktop { display: none !important; }
            .table-mobile { display: block !important; }
          }
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
