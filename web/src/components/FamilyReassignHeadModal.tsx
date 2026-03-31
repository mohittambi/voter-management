import { useState } from 'react';
import { Crown, X, Search, RefreshCw, Users, UserCheck } from 'lucide-react';
import { apiUrl } from '../../lib/api';
import { colors } from '../../lib/colors';

type SearchRow = {
  id: string;
  first_name?: string;
  middle_name?: string;
  surname?: string;
  voter_id?: string;
  name_marathi?: string;
  surname_marathi?: string;
  mobile?: string;
  village?: string;
  booth_number?: string;
};

function marathiDisplayName(nameMr?: string | null, surnameMr?: string | null): string {
  const n = (nameMr || '').trim().replace(/\s+/g, ' ');
  const s = (surnameMr || '').trim().replace(/\s+/g, ' ');
  if (!n && !s) return '';
  if (!s) return n;
  if (!n) return s;
  if (n === s) return n;
  if (n.endsWith(s)) return n;
  return `${n} ${s}`;
}

function SelectedNewHeadCard({ row, onClear }: { row: SearchRow; onClear: () => void }) {
  const en = [row.first_name, row.middle_name, row.surname].filter(Boolean).join(' ').trim();
  const mr = marathiDisplayName(row.name_marathi, row.surname_marathi);
  const meta = [
    row.voter_id ? `EPIC ${row.voter_id}` : '',
    row.mobile,
    row.village,
    row.booth_number != null && row.booth_number !== '' ? `Booth ${row.booth_number}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${colors.primaryBorderLight}`,
        background: colors.primaryLight,
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
          <UserCheck size={18} color={colors.primary} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: colors.primary, letterSpacing: '0.02em' }}>
              NEW HOUSEHOLD LEAD
            </p>
            {en ? (
              <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 600, color: colors.textHeading, lineHeight: 1.3 }}>{en}</p>
            ) : null}
            {mr ? (
              <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 500, color: colors.textSecondary, lineHeight: 1.35 }}>{mr}</p>
            ) : null}
            {meta ? (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: colors.textMuted, lineHeight: 1.45, wordBreak: 'break-word' }}>{meta}</p>
            ) : null}
          </div>
        </div>
        <button type="button" onClick={onClear} className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
          Clear
        </button>
      </div>
    </div>
  );
}

export default function FamilyReassignHeadModal({
  voter,
  familyId,
  onClose,
  onReassigned,
}: {
  readonly voter: any;
  readonly familyId: string;
  readonly onClose: () => void;
  readonly onReassigned: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [formerHeadRelationship, setFormerHeadRelationship] = useState('Other');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchRow | null>(null);
  const [saving, setSaving] = useState(false);

  async function doSearch() {
    if (!q.trim()) return;
    setSearching(true);
    setSelected(null);
    const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(q)}`));
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setSearching(false);
  }

  async function saveReassign() {
    if (!selected || selected.id === voter?.id) return;
    const headLabel = `${voter?.first_name || ''} ${voter?.surname || ''}`.trim() || voter?.voter_id || 'Current lead';
    const newLabel = `${selected.first_name || ''} ${selected.surname || ''}`.trim() || selected.voter_id || 'Selected person';
    if (
      !confirm(
        `Make ${newLabel} the primary for this household?\n\n${headLabel} will become a linked member with relationship: ${formerHeadRelationship} (to them).\n\nYou cannot undo this in one click.`
      )
    ) {
      return;
    }
    setSaving(true);
    const body = {
      family_id: familyId,
      new_head_voter_id: selected.id,
      former_head_relationship: formerHeadRelationship,
      current_head_voter_id: voter.id,
    };
    const res = await fetch(apiUrl('/api/family/reassign-head'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      alert('Household updated. This profile is now a linked member; open the new lead’s profile to manage the household.');
      onReassigned();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || 'Could not update household');
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reassign-household-title"
        style={{
          background: colors.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 700,
          maxHeight: 'min(88vh, 720px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${colors.borderLight}`,
          }}
        >
          <h3
            id="reassign-household-title"
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: colors.textHeading,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Crown size={20} /> Change household / कुटुंब प्रमुख बदला
          </h3>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px' }}>
          <p style={{ margin: '0 0 12px', color: colors.textMuted, fontSize: 14, lineHeight: 1.5 }}>
            Current lead (will become a member):{' '}
            <strong style={{ color: colors.textHeading }}>
              {voter.first_name} {voter.surname}
            </strong>{' '}
            <span style={{ color: colors.textSubtle }}>({voter.voter_id})</span>
          </p>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.warning, lineHeight: 1.45 }}>
            Choose the new lead below, then set how the current lead relates to them (e.g. Wife, Son).
          </p>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="reassign-search-q" className="label">
              Search for who will lead this household
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="reassign-search-q"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Name, mobile, or voter ID…"
                className="input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={doSearch}
                disabled={searching}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {searching ? <RefreshCw size={14} className="spin" /> : <Search size={14} />} Search
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p className="label" style={{ marginBottom: 8 }}>
                Results ({results.length})
              </p>
              <div
                style={{
                  maxHeight: 'min(36vh, 260px)',
                  overflowY: 'auto',
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: 8,
                }}
              >
                {results.map(r => {
                  const isSelf = r.id === voter?.id;
                  const isSel = selected?.id === r.id;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      disabled={isSelf}
                      onClick={() => !isSelf && setSelected(r)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderBottom: `1px solid ${colors.borderLight}`,
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.45 : 1,
                        background: isSel ? colors.primaryLight : colors.surface,
                        boxShadow: isSel ? `inset 0 0 0 2px ${colors.primary}` : 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: colors.textHeading, marginBottom: 2, fontSize: 14 }}>
                        {r.first_name} {r.middle_name && r.middle_name + ' '}
                        {r.surname}
                        {isSelf ? ' (current lead — pick someone else)' : ''}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>{r.voter_id}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selected && selected.id !== voter?.id ? <SelectedNewHeadCard row={selected} onClear={() => setSelected(null)} /> : null}

          {q && results.length === 0 && !searching && (
            <div style={{ textAlign: 'center', padding: '28px 12px', color: colors.textMuted }}>
              <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                <Users size={40} color={colors.textSubtle} />
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>No voters found for &quot;{q}&quot;</p>
            </div>
          )}
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: '14px 24px 20px',
            borderTop: `1px solid ${colors.borderLight}`,
            background: colors.surface,
            boxShadow: '0 -8px 24px rgba(15,23,42,0.06)',
          }}
        >
          <label htmlFor="former-lead-relationship" className="label" style={{ marginBottom: 6 }}>
            Current lead’s relationship to the new lead
          </label>
          <select
            id="former-lead-relationship"
            value={formerHeadRelationship}
            onChange={e => setFormerHeadRelationship(e.target.value)}
            className="input"
            disabled={!selected || selected.id === voter?.id}
            style={{ marginBottom: 14, width: '100%', maxWidth: 420 }}
          >
            <option>Wife</option>
            <option>Son</option>
            <option>Daughter</option>
            <option>Father</option>
            <option>Mother</option>
            <option>Other</option>
          </select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={saveReassign}
              disabled={!selected || selected.id === voter?.id || saving}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
