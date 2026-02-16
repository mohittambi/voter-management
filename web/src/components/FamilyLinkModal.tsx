import { useState } from 'react';

export default function FamilyLinkModal({ voter, onClose }: { readonly voter: any; readonly onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [relationship, setRelationship] = useState('Other');
  const [searching, setSearching] = useState(false);

  async function doSearch() {
    if (!q.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data || []);
    setSearching(false);
  }

  async function linkMember(targetId: string, targetName: string) {
    const body = {
      head_voter_id: voter.id,
      member_voter_id: targetId,
      relationship
    };
    const res = await fetch('/api/family/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      alert(`✅ Successfully linked ${targetName} as ${relationship}`);
      onClose();
    } else {
      const err = await res.json();
      alert('❌ Error: ' + (err?.error || 'failed'));
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        width: '90%',
        maxWidth: 700,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            🔗 Link Family Member
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#64748b',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
          Linking to: <strong>{voter.first_name} {voter.surname}</strong> ({voter.voter_id})
        </p>

        {/* Search Section */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Search for voter to link</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && doSearch()}
              placeholder="Search by name, mobile, or Aadhaar..."
              className="input"
              style={{ flex: 1 }}
            />
            <button onClick={doSearch} disabled={searching} className="btn-primary">
              {searching ? '🔄' : '🔍'} Search
            </button>
          </div>
        </div>

        {/* Relationship Selector */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="relationship-select" className="label">Relationship</label>
          <select
            id="relationship-select"
            value={relationship}
            onChange={e => setRelationship(e.target.value)}
            className="input"
          >
            <option>Wife</option>
            <option>Son</option>
            <option>Daughter</option>
            <option>Father</option>
            <option>Mother</option>
            <option>Other</option>
          </select>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div>
            <label className="label">Search Results ({results.length})</label>
            <div style={{
              maxHeight: 300,
              overflow: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              marginTop: 8
            }}>
              {results.map(r => (
                <div
                  key={r.id}
                  style={{
                    padding: 16,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                      {r.first_name} {r.middle_name && r.middle_name + ' '}{r.surname}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Voter ID: {r.voter_id}</div>
                  </div>
                  <button
                    onClick={() => linkMember(r.id, `${r.first_name} ${r.surname}`)}
                    className="btn-primary"
                    style={{ padding: '8px 20px', fontSize: 13 }}
                  >
                    🔗 Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {q && results.length === 0 && !searching && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ margin: 0 }}>No voters found matching "{q}"</p>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

