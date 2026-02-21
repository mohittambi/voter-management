import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../contexts/AuthContext';
import { colors, SR_STATUS_CONFIG } from '../lib/colors';
import { X, SlidersHorizontal, Plus, Check, MessageCircle, Clock, AlertTriangle } from 'lucide-react';

const SR_STATUSES = [
  'Document Submitted',
  'Document Shared to Office',
  'Work in Progress',
  'Work Completed',
  'Closed / Delivered',
];

const STATUS_STYLES = SR_STATUS_CONFIG;

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: colors.pageBg, color: colors.textSecondary, border: colors.borderLight };
  return (
    <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
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

interface NewRequestModalProps {
  onClose: () => void;
  onCreated: () => void;
}
function NewRequestModal({ onClose, onCreated }: NewRequestModalProps) {
  const [voterSearch, setVoterSearch] = useState('');
  const [voterResults, setVoterResults] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServiceTypes(d.filter((s: any) => s.active)));
  }, []);

  useEffect(() => {
    if (!voterSearch.trim() || voterSearch.length < 2) { setVoterResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(voterSearch)}`);
      const d = await res.json();
      setVoterResults(d.slice(0, 8));
      setSearching(false);
    }, 300);
  }, [voterSearch]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVoter) return setError('Please select a voter / मतदार निवडा');
    if (!serviceTypeId) return setError('Please select a service type / सेवा प्रकार निवडा');
    setSubmitting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ voter_id: selectedVoter.id, service_type_id: serviceTypeId, notes }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create request / विनंती तयार करणे अयशस्वी');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 32, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Service Request</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>नवीन सेवा विनंती</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>{error}</div>}

        <form onSubmit={submit}>
          {/* Voter search */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Select Voter / मतदार निवडा *
            </label>
            {selectedVoter ? (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                    {selectedVoter.name_english || `${selectedVoter.first_name || ''} ${selectedVoter.surname || ''}`.trim()}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{selectedVoter.voter_id} · {selectedVoter.village || ''}</div>
                </div>
                <button type="button" onClick={() => { setSelectedVoter(null); setVoterSearch(''); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  value={voterSearch}
                  onChange={e => setVoterSearch(e.target.value)}
                  placeholder="Search by name or voter ID / नाव किंवा मतदार ID शोधा..."
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
                {searching && <div style={{ position: 'absolute', right: 12, top: 11, color: '#94a3b8', fontSize: 13 }}>Searching...</div>}
                {voterResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, maxHeight: 240, overflowY: 'auto' }}>
                    {voterResults.map(v => (
                      <div key={v.id} onClick={() => { setSelectedVoter(v); setVoterResults([]); setVoterSearch(''); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <div style={{ fontWeight: 600 }}>{v.name_english || `${v.first_name || ''} ${v.surname || ''}`.trim()}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{v.voter_id} · {v.village || ''} {v.booth_number ? `· Booth ${v.booth_number}` : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Type */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Service Type / सेवा प्रकार *
            </label>
            <select value={serviceTypeId} onChange={e => setServiceTypeId(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: 'white' }}>
              <option value="">Select service type / सेवा प्रकार निवडा</option>
              {serviceTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Notes / नोंदी (optional)
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details / अतिरिक्त माहिती..." rows={3} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
              Cancel / रद्द करा
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
              {submitting ? 'Creating...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Create Request / विनंती तयार करा</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface StatusHistoryModalProps { requestId: string; onClose: () => void; }
function StatusHistoryModal({ requestId, onClose }: StatusHistoryModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/service-requests/${requestId}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [requestId]);

  const logs: any[] = data?.service_request_status_logs || [];
  const sorted = [...logs].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 28, width: 460, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Status History</h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>स्थिती बदल नोंदी · Request #{requestId.slice(0, 8)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading... / लोड होत आहे...</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No history found / इतिहास सापडला नाही</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sorted.map((log, i) => {
              const s = STATUS_STYLES[log.status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
              return (
                <div key={log.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < sorted.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, border: `2px solid ${s.border}`, flexShrink: 0 }} />
                    {i < sorted.length - 1 && <div style={{ width: 2, flex: 1, background: '#e2e8f0', margin: '4px 0' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <StatusBadge status={log.status} />
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                      {new Date(log.changed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>by {log.changed_by?.slice(0, 8) || 'system'}...</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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

  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServiceTypes(d));
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
      const res = await fetch(`/api/service-requests?${params}`);
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/service-requests/${requestId}`, {
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
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <StatusBadge status={r.status} />
                        <select
                          value={r.status}
                          onChange={e => updateStatus(r.id, e.target.value)}
                          disabled={statusUpdating === r.id}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 11, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#374151' }}
                        >
                          {SR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
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
                    <StatusBadge status={r.status} />
                      {r.mobile && (
                      <a href={whatsappUrl(r.mobile, r.voter_name_english, r.service_type_name, r.status)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}><MessageCircle size={20} color="#16a34a" /></a>
                    )}
                  </div>
                </div>
                {expandedRow === r.id && (
                  <div style={{ marginTop: 10, padding: '10px 0', borderTop: '1px solid #f1f5f9', fontSize: 13 }}>
                    <div style={{ marginBottom: 6 }}><span style={{ color: '#94a3b8' }}>Voter ID: </span><span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{r.voter_epic}</span></div>
                    <div style={{ marginBottom: 6 }}><span style={{ color: '#94a3b8' }}>Village: </span>{r.village || '—'}</div>
                    <div style={{ marginBottom: 6 }}><span style={{ color: '#94a3b8' }}>Raised: </span>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                    <div style={{ marginBottom: 10 }}><span style={{ color: '#94a3b8' }}>Notes: </span>{r.notes || '—'}</div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Update Status:</label>
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} disabled={statusUpdating === r.id} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 13 }}>
                        {SR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setHistoryRequestId(r.id)} style={{ width: '100%', padding: '8px', border: '1px solid #bae6fd', borderRadius: 6, background: '#f0f9ff', color: '#0369a1', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Clock size={13} /> View History / इतिहास पहा
                    </button>
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
