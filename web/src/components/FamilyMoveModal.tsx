import { useState } from 'react';
import { ArrowRightLeft, X, Search, RefreshCw, Users } from 'lucide-react';
import { apiUrl } from '../../lib/api';

export default function FamilyMoveModal({
  voter,
  currentHeadName,
  currentHeadId,
  onClose,
  onMoved,
}: {
  readonly voter: any;
  readonly currentHeadName: string;
  readonly currentHeadId?: string;
  readonly onClose: () => void;
  readonly onMoved: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [relationship, setRelationship] = useState('Wife');
  const [searching, setSearching] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const voterName = voter?.name_marathi || `${voter?.first_name || ''} ${voter?.middle_name || ''} ${voter?.surname || ''}`.trim() || voter?.voter_id || '';

  async function doSearch() {
    if (!q.trim()) return;
    setSearching(true);
    setError('');
    const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(q)}`));
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setSearching(false);
  }

  async function moveToFamily(targetId: string, targetName: string) {
    if (targetId === voter?.id) {
      setError('Cannot move to own family');
      return;
    }
    setMoving(targetId);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/family/move'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_voter_id: voter.id,
          new_head_voter_id: targetId,
          relationship,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onMoved();
        onClose();
      } else {
        setError(data?.error || 'Move failed');
      }
    } catch (e: any) {
      setError(e.message || 'Move failed');
    } finally {
      setMoving(null);
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
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        width: '90%',
        maxWidth: 700,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRightLeft size={22} /> Move to Another Family / दुसऱ्या कुटुंबात हलवा
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: 4,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
          Moving: <strong>{voterName}</strong>. Current family head: <strong>{currentHeadName || '—'}</strong>
        </p>

        {error && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Search Section */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Search for new family head</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && doSearch()}
              placeholder="Search by name, mobile, or Voter ID..."
              className="input"
              style={{ flex: 1 }}
            />
            <button onClick={doSearch} disabled={searching} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {searching ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} Search
            </button>
          </div>
        </div>

        {/* Relationship Selector */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="relationship-move-select" className="label">Relationship to new family head</label>
          <select
            id="relationship-move-select"
            value={relationship}
            onChange={e => setRelationship(e.target.value)}
            className="input"
          >
            <option>Wife</option>
            <option>Husband</option>
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
              marginTop: 8,
            }}>
              {results.map(r => {
                const isSelf = r.id === voter?.id;
                const isCurrentHead = currentHeadId && r.id === currentHeadId;
                const cannotSelect = isSelf || isCurrentHead;
                const displayName = `${r.first_name || ''} ${r.middle_name || ''} ${r.surname || ''}`.trim() || r.voter_id;
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: 16,
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                      opacity: cannotSelect ? 0.6 : 1,
                    }}
                    onMouseEnter={e => !cannotSelect && (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        {displayName} {isSelf && '(current voter)'} {isCurrentHead && '(current family head)'}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Voter ID: {r.voter_id}</div>
                    </div>
                    <button
                      onClick={() => !cannotSelect && moveToFamily(r.id, displayName)}
                      disabled={cannotSelect || moving === r.id}
                      className="btn-primary"
                      style={{
                        padding: '8px 20px',
                        fontSize: 13,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: cannotSelect ? 0.5 : 1,
                        cursor: cannotSelect ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {moving === r.id ? 'Moving...' : <><ArrowRightLeft size={13} /> Move</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {q && results.length === 0 && !searching && (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Users size={48} color="#94a3b8" /></div>
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
