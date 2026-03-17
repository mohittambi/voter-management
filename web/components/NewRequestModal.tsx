import { useState, useEffect, useRef } from 'react';
import { supabase } from '../contexts/AuthContext';
import { apiUrl } from '../lib/api';
import { X, Check, Pencil, UserPlus, Paperclip } from 'lucide-react';
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
  const [isMinorApplicant, setIsMinorApplicant] = useState(false);
  const [minorFirstName, setMinorFirstName] = useState('');
  const [minorMiddleName, setMinorMiddleName] = useState('');
  const [minorSurname, setMinorSurname] = useState('');
  const [minorMobile, setMinorMobile] = useState('');
  const [minorDob, setMinorDob] = useState('');
  const [refVoterSearch, setRefVoterSearch] = useState('');
  const [refVoterResults, setRefVoterResults] = useState<any[]>([]);
  const [selectedRefVoter, setSelectedRefVoter] = useState<any>(null);
  const [refSearching, setRefSearching] = useState(false);
  const [pendingDocs, setPendingDocs] = useState<{ file: File; documentType: string }[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!isMinorApplicant || !refVoterSearch.trim() || refVoterSearch.length < 2) {
      setRefVoterResults([]);
      return;
    }
    if (refDebounce.current) clearTimeout(refDebounce.current);
    refDebounce.current = setTimeout(async () => {
      setRefSearching(true);
      const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(refVoterSearch)}`));
      const d = await res.json();
      setRefVoterResults(d.slice(0, 8));
      setRefSearching(false);
    }, 300);
  }, [refVoterSearch, isMinorApplicant]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceTypeId) return setError('Please select a service type / सेवा प्रकार निवडा');

    let voterId: string;
    if (isMinorApplicant) {
      if (!minorFirstName.trim() || !minorSurname.trim()) return setError('First name and surname required / नाव आवश्यक');
      if (!selectedRefVoter) return setError('Please select reference voter (e.g. father/mother) / संदर्भ मतदार निवडा');
      setSubmitting(true);
      setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const regRes = await fetch(apiUrl('/api/voters/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({
            first_name: minorFirstName.trim(),
            middle_name: minorMiddleName.trim() || undefined,
            surname: minorSurname.trim(),
            mobile: minorMobile.trim() || undefined,
            dob: minorDob || undefined,
            reference_voter_id: selectedRefVoter.id,
          }),
        });
        if (!regRes.ok) { const err = await regRes.json(); throw new Error(err.error); }
        const registered = await regRes.json();
        voterId = registered.id;
      } catch (err: any) {
        setError(err.message || 'Failed to register applicant / अर्जदार नोंदणी अयशस्वी');
        setSubmitting(false);
        return;
      }
    } else {
      const voter = selectedVoter || initialVoter;
      if (!voter) return setError('Please select a voter / मतदार निवडा');
      voterId = voter.id;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      for (const { file, documentType } of pendingDocs) {
        const form = new FormData();
        form.append('file', file);
        form.append('voter_id', voterId);
        form.append('document_type', documentType);
        const upRes = await fetch(apiUrl('/api/voter-documents'), {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (!upRes.ok) {
          const err = await upRes.json();
          throw new Error(err.error || 'Document upload failed');
        }
      }
      const res = await fetch(apiUrl('/api/service-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ voter_id: voterId, service_type_id: serviceTypeId, notes }),
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

  const effectiveVoter = isMinorApplicant ? null : (selectedVoter || initialVoter);

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
          {/* Minor applicant toggle */}
          {!isVoterLocked && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={isMinorApplicant} onChange={e => { setIsMinorApplicant(e.target.checked); setSelectedVoter(null); setVoterSearch(''); setSelectedRefVoter(null); setRefVoterSearch(''); }} />
                <UserPlus size={16} />
                Applicant not in voter list (register new) / अर्जदार मतदार यादीत नाही (नवीन नोंदणी)
              </label>
            </div>
          )}

          {/* Voter search OR minor applicant form */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {isMinorApplicant ? 'Applicant details / अर्जदार तपशील' : 'Select Voter / मतदार निवडा *'}
            </label>
            {isMinorApplicant ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#f8fafc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input value={minorFirstName} onChange={e => setMinorFirstName(e.target.value)} placeholder="First name *" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
                  <input value={minorMiddleName} onChange={e => setMinorMiddleName(e.target.value)} placeholder="Middle name" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <input value={minorSurname} onChange={e => setMinorSurname(e.target.value)} placeholder="Surname *" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <input value={minorMobile} onChange={e => setMinorMobile(e.target.value)} type="tel" placeholder="Mobile" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
                  <input value={minorDob} onChange={e => setMinorDob(e.target.value)} type="date" placeholder="DOB" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
                </div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Reference voter (e.g. father/mother) / संदर्भ मतदार *</label>
                {selectedRefVoter ? (
                  <div style={{ background: 'white', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>{selectedRefVoter.name_english || `${selectedRefVoter.first_name || ''} ${selectedRefVoter.surname || ''}`.trim()} · {selectedRefVoter.voter_id}</span>
                    <button type="button" onClick={() => { setSelectedRefVoter(null); setRefVoterSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={14} /></button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input value={refVoterSearch} onChange={e => setRefVoterSearch(e.target.value)} placeholder="Search reference voter..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                    {refSearching && <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, color: '#94a3b8' }}>Searching...</span>}
                    {refVoterResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                        {refVoterResults.map(v => (
                          <div key={v.id} onClick={() => { setSelectedRefVoter(v); setRefVoterResults([]); setRefVoterSearch(''); }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                            {v.name_english || `${v.first_name || ''} ${v.surname || ''}`.trim()} · {v.voter_id}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : effectiveVoter ? (
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
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Notes / नोंदी (optional)
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details / अतिरिक्त माहिती..." rows={3} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Document upload (optional) - show when voter is or will be determined */}
          {(effectiveVoter || isMinorApplicant) && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                <Paperclip size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Attach documents (optional) / दस्तऐवज जोडा
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <select id="doc-type" defaultValue="Aadhaar Card" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: 'white' }}>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const type = (document.getElementById('doc-type') as HTMLSelectElement)?.value || 'Other';
                    const files = Array.from(e.target.files || []);
                    setPendingDocs(prev => [...prev, ...files.map(file => ({ file, documentType: type }))]);
                    e.target.value = '';
                  }}
                  style={{ fontSize: 13 }}
                />
              </div>
              {pendingDocs.length > 0 && (
                <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 13, color: '#475569' }}>
                  {pendingDocs.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {p.file.name} ({p.documentType})
                      <button type="button" onClick={() => setPendingDocs(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0, fontSize: 12 }}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
