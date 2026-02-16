import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [booth, setBooth] = useState('');
  const [status, setStatus] = useState('');
  const [village, setVillage] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  async function doSearch() {
    if (!q.trim() && !booth && !status && !village) return;
    setSearching(true);
    
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (booth) params.append('booth', booth);
    if (status) params.append('status', status);
    if (village) params.append('village', village);
    
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    setResults(data || []);
    setSearching(false);
  }

  function clearFilters() {
    setQ('');
    setBooth('');
    setStatus('');
    setVillage('');
    setResults([]);
  }

  return (
    <DashboardLayout>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: 24
      }}>
        {/* Main Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="नाव, मोबाईल, Voter ID शोधा / Search by name, mobile, voter ID..."
            onKeyPress={e => e.key === 'Enter' && doSearch()}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none'
            }}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters ? '#6366f1' : '#f3f4f6',
              color: showFilters ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              padding: '12px 20px',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            🔽 Filter
          </button>
          <button
            onClick={doSearch}
            disabled={searching}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 14,
              cursor: searching ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              opacity: searching ? 0.6 : 1
            }}
          >
            {searching ? '⏳ शोधत आहे...' : '🔍 शोधा / Search'}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            padding: 16,
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label className="label" style={{ marginBottom: 4, display: 'block', fontSize: 13, fontWeight: 500 }}>
                  बुथ नंबर / Booth Number
                </label>
                <input
                  type="number"
                  value={booth}
                  onChange={e => setBooth(e.target.value)}
                  placeholder="237"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="label" style={{ marginBottom: 4, display: 'block', fontSize: 13, fontWeight: 500 }}>
                  स्थिती / Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="">सर्व / All</option>
                  <option value="Active">Active</option>
                  <option value="मयत">मयत / Deceased</option>
                  <option value="दुबार">दुबार / Duplicate</option>
                  <option value="बेपत्ता">बेपत्ता / Missing</option>
                </select>
              </div>

              <div>
                <label className="label" style={{ marginBottom: 4, display: 'block', fontSize: 13, fontWeight: 500 }}>
                  गाव / Village
                </label>
                <input
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder="मनोली"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#1f2937', fontWeight: 600 }}>
            {results.length} मतदार सापडले / Found {results.length} voter{results.length !== 1 ? 's' : ''}
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {results.map(r => (
              <Link
                key={r.id}
                href={`/voter/${r.id}`}
                style={{
                  display: 'block',
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                  background: 'white'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {/* Marathi Name (Primary) */}
                    {r.name_marathi && (
                      <h4 style={{ margin: 0, fontSize: 16, color: '#1f2937', fontWeight: 600 }}>
                        {r.name_marathi}
                      </h4>
                    )}
                    
                    {/* English Name (Secondary) */}
                    {r.name_english && (
                      <p style={{ margin: '2px 0 0', fontSize: 14, color: '#6b7280' }}>
                        {r.name_english}
                      </p>
                    )}

                    {/* Voter ID & Booth */}
                    <div style={{ margin: '8px 0 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>
                        <strong>Voter ID:</strong> {r.voter_id}
                      </span>
                      {r.booth_number && (
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          <strong>बुथ:</strong> {r.booth_number}
                        </span>
                      )}
                      {r.age && (
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          <strong>वय:</strong> {r.age}
                        </span>
                      )}
                      {r.gender && (
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          <strong>लिंग:</strong> {r.gender}
                        </span>
                      )}
                    </div>

                    {/* Village & Status */}
                    <div style={{ margin: '6px 0 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                      {r.village && (
                        <span style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: 4
                        }}>
                          📍 {r.village}
                        </span>
                      )}
                      {r.status && (
                        <span style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          background: r.status === 'Active' ? '#d1fae5' : '#fee2e2',
                          color: r.status === 'Active' ? '#065f46' : '#991b1b',
                          borderRadius: 4
                        }}>
                          {r.status === 'Active' ? '✅ Active' : `⚠️ ${r.status}`}
                        </span>
                      )}
                    </div>

                    {/* Mobile & Address */}
                    {(r.mobile || r.address_marathi) && (
                      <div style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
                        {r.mobile && <span>📱 {r.mobile}</span>}
                        {r.mobile && r.address_marathi && <span style={{ margin: '0 8px' }}>•</span>}
                        {r.address_marathi && <span>{r.address_marathi}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ color: '#3b82f6', fontSize: 20, marginLeft: 16 }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searching && results.length === 0 && (q || booth || status || village) && (
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ margin: 0, color: '#6b7280' }}>
            कोणतेही मतदार सापडले नाहीत / No voters found matching your search
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
