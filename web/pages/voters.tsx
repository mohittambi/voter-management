import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { colors, VOTER_LIST_ROW, VOTER_STATUS_CONFIG } from '../lib/colors';
import { apiUrl } from '../lib/api';
import {
  VOTER_LIST_LEGEND_ORDER,
  getVoterListRecordPill,
  getVoterListRowStyle,
} from '../lib/voterProfileCompleteness';
import AddVoterModal from '../components/AddVoterModal';
import { Search, SlidersHorizontal, Upload, X, AlertTriangle, CheckCircle2, Copy, Phone, UserPlus, Download } from 'lucide-react';

const PAGE_SIZES = [25, 50, 100];
const STATUS_OPTIONS = ['Active', 'मयत', 'दुबार', 'बेपत्ता'];
const GENDER_OPTIONS = [{ value: 'M', label: 'Male / पुरुष' }, { value: 'F', label: 'Female / महिला' }];

const STATUS_COLORS = VOTER_STATUS_CONFIG;

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || { bg: colors.pageBg, color: colors.textSecondary };
  return (
    <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {status || 'Active'}
    </span>
  );
}

function Skeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div style={{ padding: '4px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
          {Array.from({ length: 6 }).map((_, j) => (
            <div key={j} style={{ height: 14, flex: j === 1 ? 2 : 1, background: '#f1f5f9', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  return (
    <button onClick={copy} title="Copy / कॉपी करा" style={{
      padding: '3px 6px',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      background: copied ? '#d1fae5' : 'white',
      color: copied ? '#065f46' : '#475569',
      fontSize: 11,
      cursor: 'pointer',
      transition: 'all 0.15s',
      flexShrink: 0,
    }}>
      {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
    </button>
  );
}

function CallButton({ mobile }: { mobile: string }) {
  return (
    <a href={`tel:${mobile}`} onClick={e => e.stopPropagation()} title="Call / कॉल करा" style={{
      padding: '3px 6px',
      border: '1px solid #bbf7d0',
      borderRadius: 6,
      background: '#f0fdf4',
      color: '#065f46',
      fontSize: 11,
      textDecoration: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      display: 'inline-flex', alignItems: 'center',
    }}>
      <Phone size={11} />
    </a>
  );
}

interface UploadModalProps { onClose: () => void; onSuccess: () => void; }
function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; families: number } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: fd });
      if (res.ok) {
        const d = await res.json();
        setResult({ imported: d.imported, families: d.families_created || 0 });
        onSuccess();
      } else {
        const err = await res.json();
        alert(`Upload failed / अपलोड अयशस्वी: ${err.error || 'Unknown error'}`);
      }
    } catch {
      alert('Upload failed / अपलोड अयशस्वी');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 32, width: 460, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Upload Voter List</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>मतदार यादी अपलोड करा</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><CheckCircle2 size={48} color="#10b981" /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>Upload Successful / अपलोड यशस्वी!</div>
            <div style={{ fontSize: 14, color: '#475569' }}>{result.imported} voters imported / {result.imported} मतदार आयात</div>
            <div style={{ fontSize: 14, color: '#475569' }}>{result.families} families linked / {result.families} कुटुंबे जोडली</div>
            <button onClick={onClose} className="btn-primary" style={{ marginTop: 20 }}>Close / बंद करा</button>
          </div>
        ) : (
          <>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 32, textAlign: 'center', background: '#f8fafc', cursor: uploading ? 'not-allowed' : 'pointer' }}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={uploading} style={{ display: 'none' }} id="upload-file" />
              <label htmlFor="upload-file" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Upload size={40} color={uploading ? '#3b82f6' : '#94a3b8'} /></div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                  {uploading ? 'Uploading... / अपलोड होत आहे...' : fileName ? fileName : 'Click to select file / फाइल निवडण्यासाठी क्लिक करा'}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Supports .xlsx, .xls, .csv | Manoli format</div>
              </label>
            </div>
            {!uploading && !fileName && (
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
                Admin only / केवळ प्रशासकासाठी
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VotersPage() {
  const router = useRouter();
  const { role } = useAuth();
  const hideAdminColumns = role === 'admin';
  const [voters, setVoters] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [booth, setBooth] = useState('');
  const [village, setVillage] = useState('');
  const [gender, setGender] = useState('');
  const [caste, setCaste] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [status, setStatus] = useState('');
  const [familyHead, setFamilyHead] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [workers, setWorkers] = useState<{ id: string; name: string; mobile?: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('serial_number');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddVoter, setShowAddVoter] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { view, workerId: qWorkerId } = router.query;
    if (view === 'staff') setShowFilters(true);
    if (typeof qWorkerId === 'string' && qWorkerId) setWorkerId(qWorkerId);
  }, [router.query]);

  useEffect(() => {
    fetch(apiUrl('/api/workers'))
      .then(r => r.json())
      .then(d => setWorkers(Array.isArray(d) ? d : []))
      .catch(() => setWorkers([]));
  }, []);

  const fetchVoters = useCallback(async (overrides: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(overrides.page ?? page),
      pageSize: String(overrides.pageSize ?? pageSize),
      q: overrides.q ?? q,
      booth: overrides.booth ?? booth,
      village: overrides.village ?? village,
      gender: overrides.gender ?? gender,
      caste: overrides.caste ?? caste,
      ageMin: overrides.ageMin ?? ageMin,
      ageMax: overrides.ageMax ?? ageMax,
      status: overrides.status ?? status,
      familyHead: overrides.familyHead ?? familyHead,
      workerId: overrides.workerId ?? workerId,
      sortBy: overrides.sortBy ?? sortBy,
      sortDir: overrides.sortDir ?? sortDir,
    });
    try {
      const res = await fetch(apiUrl(`/api/voters/list?${params}`));
      if (!res.ok) throw new Error('Failed to load voters');
      const d = await res.json();
      setVoters(d.data || []);
      setTotal(d.total || 0);
    } catch (e: any) {
      setError(e.message || 'Error loading voters / मतदार लोड करताना त्रुटी');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, booth, village, gender, caste, ageMin, ageMax, status, familyHead, workerId, sortBy, sortDir]);

  useEffect(() => { fetchVoters(); }, [page, pageSize, sortBy, sortDir]);

  function handleSearch() {
    setPage(1);
    fetchVoters({ page: 1 });
  }

  function handleFilterChange(key: string, val: string) {
    const map: Record<string, (v: string) => void> = {
      booth: setBooth, village: setVillage, gender: setGender,
      caste: setCaste, ageMin: setAgeMin, ageMax: setAgeMax, status: setStatus, familyHead: setFamilyHead, workerId: setWorkerId,
    };
    map[key]?.(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchVoters({ page: 1, [key]: val });
    }, 400);
  }

  function clearFilters() {
    setBooth(''); setVillage(''); setGender(''); setCaste('');
    setAgeMin(''); setAgeMax(''); setStatus(''); setQ(''); setFamilyHead(''); setWorkerId('');
    setPage(1);
    fetchVoters({ page: 1, booth: '', village: '', gender: '', caste: '', ageMin: '', ageMax: '', status: '', familyHead: '', workerId: '', q: '' });
  }

  function handleExport() {
    const params = new URLSearchParams({
      q, booth, village, gender, caste, ageMin, ageMax, status, familyHead, workerId,
    });
    window.open(apiUrl(`/api/voters/export?${params}`), '_blank');
  }

  function handleSort(col: string) {
    const newDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc';
    setSortBy(col); setSortDir(newDir);
  }

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: '#2563eb' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = !!(q || booth || village || gender || caste || ageMin || ageMax || status || familyHead || workerId);

  const thStyle: React.CSSProperties = {
    padding: '11px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700,
    color: colors.textSecondary, background: colors.pageBg, borderBottom: `2px solid ${colors.borderLight}`,
    whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
  };
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: 13, color: colors.textPrimary,
    borderBottom: '1px solid #F0F0F0', verticalAlign: 'middle',
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: 8 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, voter ID, mobile / नाव, मतदार ID, मोबाईल शोधा..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', minWidth: 0 }}
            />
            <button onClick={handleSearch} className="btn-primary" style={{ padding: '10px 18px', fontSize: 14, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} /> Search
            </button>
          </div>
          <button onClick={() => setShowFilters(f => !f)} style={{
            padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 8,
            background: showFilters ? '#ede9fe' : 'white', color: showFilters ? '#6d28d9' : '#374151',
            fontSize: 14, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><SlidersHorizontal size={14} /> Filters {hasFilters ? `(${[q, booth, village, gender, caste, ageMin, ageMax, status, familyHead, workerId].filter(Boolean).length})` : ''}</span>
          </button>
          <button onClick={() => setShowAddVoter(true)} className="btn-primary" style={{ padding: '10px 18px', fontSize: 14, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={14} /> Add Voter
          </button>
          <button onClick={() => setShowUpload(true)} style={{ padding: '10px 18px', fontSize: 14, whiteSpace: 'nowrap', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Upload size={14} /> Upload
          </button>
          <button onClick={handleExport} style={{ padding: '10px 18px', fontSize: 14, whiteSpace: 'nowrap', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Booth / बुथ</label>
              <input type="number" value={booth} onChange={e => handleFilterChange('booth', e.target.value)} placeholder="Booth #" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Village / गाव</label>
              <input value={village} onChange={e => handleFilterChange('village', e.target.value)} placeholder="Village name" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Gender / लिंग</label>
              <select value={gender} onChange={e => handleFilterChange('gender', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white' }}>
                <option value="">All</option>
                {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Caste / जात</label>
              <input value={caste} onChange={e => handleFilterChange('caste', e.target.value)} placeholder="Caste" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Age From / वय पासून</label>
              <input type="number" value={ageMin} onChange={e => handleFilterChange('ageMin', e.target.value)} placeholder="Min" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Age To / वय पर्यंत</label>
              <input type="number" value={ageMax} onChange={e => handleFilterChange('ageMax', e.target.value)} placeholder="Max" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Status / स्थिती</label>
              <select value={status} onChange={e => handleFilterChange('status', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white' }}>
                <option value="">All</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Family Head / कुटुंब प्रमुख</label>
              <select value={familyHead} onChange={e => handleFilterChange('familyHead', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white' }}>
                <option value="">All</option>
                <option value="head">Family Heads Only</option>
                <option value="member">Family Members Only</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Staff / कार्यकर्ता</label>
              <select value={workerId} onChange={e => handleFilterChange('workerId', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white' }}>
                <option value="">All</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}{w.mobile ? ` (${w.mobile})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {hasFilters && (
                <button onClick={clearFilters} style={{ width: '100%', padding: '8px 10px', border: '1px solid #fecaca', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <X size={12} /> Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#991b1b', fontSize: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> {error}</span>
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Table header meta */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>
              {loading ? 'Loading...' : `${total.toLocaleString('en-IN')} voters / मतदार`}
              {hasFilters && <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8' }}>(filtered)</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Rows / पंक्ती:</span>
              {PAGE_SIZES.map(ps => (
                <button key={ps} onClick={() => { setPageSize(ps); setPage(1); }} style={{
                  padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12,
                    background: pageSize === ps ? colors.primary : 'white',
                    color: pageSize === ps ? 'white' : colors.textSecondary,
                  cursor: 'pointer', fontWeight: pageSize === ps ? 700 : 400,
                }}>
                  {ps}
                </button>
              ))}
            </div>
          </div>

          {/* Row colour legend */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px', fontSize: 11, color: colors.textSecondary }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>Record colours / नोंद रंग:</span>
            {VOTER_LIST_LEGEND_ORDER.map((key) => {
              const e = VOTER_LIST_ROW[key];
              return (
                <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={`${e.labelEn} — ${e.labelMr}`}>
                  <span style={{ width: 4, height: 18, borderRadius: 1, background: e.border, flexShrink: 0 }} />
                  <span>{e.labelEn}</span>
                </span>
              );
            })}
          </div>

          {/* Desktop table */}
          <div style={{ overflowX: 'auto' }} className="table-desktop">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle} onClick={() => handleSort('serial_number')}>#<SortIcon col="serial_number" /></th>
                  <th style={thStyle} onClick={() => handleSort('voter_id')}>Voter ID / मतदार ID <SortIcon col="voter_id" /></th>
                  <th style={thStyle} onClick={() => handleSort('name_english')}>Name (English) <SortIcon col="name_english" /></th>
                  <th style={thStyle} onClick={() => handleSort('name_marathi')}>नाव (मराठी) <SortIcon col="name_marathi" /></th>
                  <th style={thStyle}>Rel. / संबंध</th>
                  <th style={thStyle} onClick={() => handleSort('age')}>Age / Gender <SortIcon col="age" /></th>
                  <th style={thStyle} onClick={() => handleSort('booth_number')}>Booth <SortIcon col="booth_number" /></th>
                  {!hideAdminColumns && <th style={thStyle}>Village / गाव</th>}
                  <th style={thStyle}>Mobile / मोबाईल</th>
                  {!hideAdminColumns && <th style={thStyle} onClick={() => handleSort('caste')}>Caste / जात <SortIcon col="caste" /></th>}
                  <th style={thStyle}>Record / नोंद</th>
                  <th style={thStyle}>Status</th>
                  {!hideAdminColumns && <th style={thStyle}>Staff / कार्यकर्ता</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={hideAdminColumns ? 10 : 13} style={{ padding: 0 }}><Skeleton /></td></tr>
                ) : voters.length === 0 ? (
                  <tr><td colSpan={hideAdminColumns ? 10 : 13} style={{ ...tdStyle, textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    No voters found / कोणतेही मतदार सापडले नाही
                  </td></tr>
                ) : voters.map((v, i) => {
                  const rowStyle = getVoterListRowStyle(v);
                  const pill = getVoterListRecordPill(v);
                  return (
                  <tr key={v.id} onClick={() => router.push(`/voter/${v.id}`)} style={{
                    cursor: 'pointer',
                    background: rowStyle.background,
                    borderLeft: rowStyle.borderLeft,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = rowStyle.hoverBackground; }}
                  onMouseLeave={e => { e.currentTarget.style.background = rowStyle.background; }}>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontSize: 12 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: colors.primary, fontWeight: 600 }}>{v.voter_id}</span>
                        <CopyButton text={v.voter_id} />
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{v.name_english || `${v.first_name || ''} ${v.middle_name || ''} ${v.surname || ''}`.trim()}</td>
                    <td style={{ ...tdStyle, fontFamily: 'serif' }}>
                      <div>{v.name_marathi || '—'}</div>
                      {v.first_name_marathi ? (
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }} title="First name (Marathi) / पहिले नाव">
                          {v.first_name_marathi}
                          {v.surname_marathi ? ` · ${v.surname_marathi}` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, maxWidth: 100 }} title={v.household_relation_code || undefined}>
                      {v.household_relation_code || '—'}
                    </td>
                    <td style={tdStyle}>{v.age && <span style={{ fontWeight: 600 }}>{v.age}</span>}{v.age && v.gender && ' / '}{v.gender}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{v.booth_number}</td>
                    {!hideAdminColumns && <td style={{ ...tdStyle, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.village}</td>}
                    <td style={tdStyle}>
                      {v.mobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: v.mobile_secondary ? 4 : 0 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.mobile}</span>
                          <CopyButton text={v.mobile} />
                          <CallButton mobile={v.mobile} />
                        </div>
                      )}
                      {v.mobile_secondary && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{v.mobile_secondary}</span>
                          <CopyButton text={v.mobile_secondary} />
                          <CallButton mobile={v.mobile_secondary} />
                        </div>
                      )}
                    </td>
                    {!hideAdminColumns && <td style={{ ...tdStyle, fontSize: 12 }}>{v.caste}</td>}
                    <td style={{ ...tdStyle, maxWidth: 100 }}>
                      <span
                        title={pill.tooltip}
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          background: VOTER_LIST_ROW[pill.category].bg,
                          color: VOTER_LIST_ROW[pill.category].border,
                          border: `1px solid ${VOTER_LIST_ROW[pill.category].border}`,
                          cursor: 'help',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pill.text}
                      </span>
                    </td>
                    <td style={tdStyle}><StatusBadge status={v.status} /></td>
                    {!hideAdminColumns && <td style={{ ...tdStyle, fontSize: 12, color: '#64748b' }}>{v.worker_name}</td>}
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="table-mobile" style={{ display: 'none' }}>
            {loading ? <Skeleton rows={6} /> : voters.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No voters found / कोणतेही मतदार सापडले नाही</div>
            ) : voters.map(v => {
              const rowStyle = getVoterListRowStyle(v);
              const pill = getVoterListRecordPill(v);
              return (
              <div
                key={v.id}
                style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: rowStyle.background, borderLeft: rowStyle.borderLeft, boxSizing: 'border-box' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = rowStyle.hoverBackground; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = rowStyle.background; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{v.name_english || `${v.first_name || ''} ${v.surname || ''}`.trim()}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'serif', marginTop: 2 }}>{v.name_marathi}</div>
                    {v.first_name_marathi ? (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {v.first_name_marathi}{v.surname_marathi ? ` · ${v.surname_marathi}` : ''}
                      </div>
                    ) : null}
                    {v.household_relation_code ? (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Rel. / संबंध: {v.household_relation_code}</div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span
                      title={pill.tooltip}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        background: VOTER_LIST_ROW[pill.category].bg,
                        color: VOTER_LIST_ROW[pill.category].border,
                        border: `1px solid ${VOTER_LIST_ROW[pill.category].border}`,
                        cursor: 'help',
                      }}
                    >
                      {pill.text}
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>{v.village} {v.village && v.booth_number ? '·' : ''} Booth {v.booth_number}</div>
                {v.mobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{v.mobile}</span>
                    <CopyButton text={v.mobile} />
                    <CallButton mobile={v.mobile} />
                  </div>
                )}
                {expandedRow === v.id && (
                  <div style={{ marginTop: 10, padding: '10px 0', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: colors.textDisabled }}>Voter ID: </span><span style={{ fontFamily: 'monospace', fontWeight: 600, color: colors.primary }}>{v.voter_id}</span></div>
                    <div><span style={{ color: '#94a3b8' }}>Age: </span>{v.age} / {v.gender}</div>
                    {v.household_relation_code ? <div><span style={{ color: '#94a3b8' }}>Rel.: </span>{v.household_relation_code}</div> : null}
                    <div><span style={{ color: '#94a3b8' }}>Caste: </span>{v.caste || '—'}</div>
                    <div><span style={{ color: '#94a3b8' }}>Staff: </span>{v.worker_name || '—'}</div>
                    {v.mobile_secondary && <div><span style={{ color: '#94a3b8' }}>Alt Mobile: </span>{v.mobile_secondary}</div>}
                    <button onClick={() => router.push(`/voter/${v.id}`)} style={{
                      gridColumn: '1/-1', marginTop: 6, padding: '8px', border: '1px solid #2563eb', borderRadius: 6,
                      background: 'white', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>View Profile / प्रोफाइल पहा</button>
                  </div>
                )}
                <button onClick={() => setExpandedRow(expandedRow === v.id ? null : v.id)} style={{
                  marginTop: 8, padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
                  background: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer',
                }}>
                  {expandedRow === v.id ? '▲ Less' : '▼ More details'}
                </button>
              </div>
            );
            })}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Page {page} of {totalPages} — {((page - 1) * pageSize + 1).toLocaleString('en-IN')}–{Math.min(page * pageSize, total).toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(1)} disabled={page === 1} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>«</button>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>‹ Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pg = page <= 3 ? i + 1 : page - 2 + i;
                  if (pg > totalPages) return null;
                  return (
                    <button key={pg} onClick={() => setPage(pg)} style={{ padding: '6px 12px', border: `1px solid ${colors.borderLight}`, borderRadius: 6, background: pg === page ? colors.primary : 'white', color: pg === page ? 'white' : colors.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: pg === page ? 700 : 400 }}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>Next ›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>»</button>
              </div>
            </div>
          )}
        </div>

        {showAddVoter && <AddVoterModal onClose={() => setShowAddVoter(false)} onSuccess={() => { setShowAddVoter(false); fetchVoters(); }} />}
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => fetchVoters()} />}

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
