import { useState, useEffect, useRef } from 'react';
import { supabase } from '../contexts/AuthContext';
import { apiUrl } from '../lib/api';
import { X, Check, Pencil } from 'lucide-react';
import VoterEditDrawer from './VoterEditDrawer';

export interface NewRequestModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialVoter?: any;
  lockVoter?: boolean;
}

export default function NewRequestModal({
  onClose,
  onCreated,
  initialVoter,
  lockVoter = false,
}: NewRequestModalProps) {
  const [voterSearch, setVoterSearch] = useState('');
  const [voterResults, setVoterResults] = useState<any[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<any>(initialVoter || null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVoterLocked = lockVoter || !!initialVoter;

  useEffect(() => {
    if (initialVoter) setSelectedVoter(initialVoter);
  }, [initialVoter]);

  useEffect(() => {
    fetch(apiUrl('/api/services')).then(r => r.json()).then(d => setServiceTypes(d.filter((s: any) => s.active)));
  }, []);

  useEffect(() => {
    if (isVoterLocked || !voterSearch.trim() || voterSearch.length < 2) {
      setVoterResults([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(voterSearch)}`));
      const d = await res.json();
      setVoterResults(d.slice(0, 8));
      setSearching(false);
    }, 300);
  }, [voterSearch, isVoterLocked]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const voter = selectedVoter || initialVoter;
    if (!voter) return setError('Please select a voter / मतदार निवडा');
    if (!serviceTypeId) return setError('Please select a service type / सेवा प्रकार निवडा');
    setSubmitting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(apiUrl('/api/service-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ voter_id: voter.id, service_type_id: serviceTypeId, notes }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const sr = await res.json();
      onCreated();
      onClose();
      if (sr?.id) {
        window.open(apiUrl(`/api/service-requests/${sr.id}/pdf`), '_blank', 'noopener');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create request / विनंती तयार करणे अयशस्वी');
    } finally {
      setSubmitting(false);
    }
  }

  const effectiveVoter = selectedVoter || initialVoter;

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
            {effectiveVoter ? (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {effectiveVoter.name_english || `${effectiveVoter.first_name || ''} ${effectiveVoter.surname || ''}`.trim()}
                    <button
                      type="button"
                      onClick={() => setShowEditDrawer(true)}
                      title="Edit voter / मतदार संपादन"
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', borderRadius: 4 }}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{effectiveVoter.voter_id} · {effectiveVoter.village || ''}</div>
                </div>
                {!isVoterLocked && (
                  <button type="button" onClick={() => { setSelectedVoter(null); setVoterSearch(''); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  value={voterSearch}
                  onChange={e => setVoterSearch(e.target.value)}
                  placeholder="Search by name, Voter ID, or mobile / नाव, मतदार ID, मोबाईल शोधा..."
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

      {showEditDrawer && effectiveVoter && (
        <VoterEditDrawer
          voter={effectiveVoter}
          open={showEditDrawer}
          onClose={() => setShowEditDrawer(false)}
          onSaved={(updatedProfile) => {
            setSelectedVoter((prev: any) => (prev ? { ...prev, village: updatedProfile?.village ?? prev.village, mobile: updatedProfile?.mobile ?? prev.mobile } : prev));
            setShowEditDrawer(false);
          }}
        />
      )}
    </div>
  );
}
