import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { UserCheck, Phone, Users, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiUrl } from '../lib/api';
import { colors } from '../lib/colors';
import { supabase } from '../contexts/AuthContext';

type AssignedVoter = {
  id: string;
  voter_id: string;
  name: string;
  mobile?: string | null;
  village?: string | null;
};

type WorkerMapping = {
  id: string;
  name: string;
  mobile?: string | null;
  assigned_count: number;
  voters: AssignedVoter[];
};

function WorkerModal({
  worker,
  onClose,
  onSaved,
}: {
  worker: WorkerMapping | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(worker?.name || '');
  const [mobile, setMobile] = useState(worker?.mobile || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(apiUrl('/api/workers'), {
        method: worker ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(worker ? { id: worker.id, name, mobile } : { name, mobile }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Request failed');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save karyakarta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 28, width: 400, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{worker ? 'Edit Karyakarta / कार्यकर्ता संपादन' : 'Add Karyakarta / कार्यकर्ता जोडा'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>{error}</div>}
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Karyakarta Name / कार्यकर्ता नाव *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mobile / मोबाईल</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} type="tel" style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 14, cursor: 'pointer' }}>Cancel / रद्द करा</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={14} /> {worker ? 'Update / अद्यतन' : 'Create / तयार करा'}</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WorkerMapping | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchByWorker, setSearchByWorker] = useState<Record<string, string>>({});
  const [resultsByWorker, setResultsByWorker] = useState<Record<string, any[]>>({});
  const [selectedByWorker, setSelectedByWorker] = useState<Record<string, any[]>>({});
  const [savingWorkerId, setSavingWorkerId] = useState<string | null>(null);
  const [savingActionByWorker, setSavingActionByWorker] = useState<Record<string, 'assign' | 'remove' | undefined>>({});
  const [removingVoterId, setRemovingVoterId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(apiUrl('/api/workers?view=mapping'));
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch workers');
        setWorkers(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch workers');
      } finally {
        setLoading(false);
      }
  }

  async function searchVoters(workerId: string, q: string) {
    setSearchByWorker(prev => ({ ...prev, [workerId]: q }));
    if (!q.trim() || q.trim().length < 2) {
      setResultsByWorker(prev => ({ ...prev, [workerId]: [] }));
      return;
    }
    const res = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(q.trim())}`));
    const data = await res.json();
    setResultsByWorker(prev => ({ ...prev, [workerId]: Array.isArray(data) ? data.slice(0, 8) : [] }));
  }

  async function patchAssignment(voterId: string, payload: { worker_id?: string | null }) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(apiUrl('/api/assignments'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ voter_id: voterId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Assignment update failed');
  }

  function toggleCandidate(workerId: string, candidate: any) {
    setSelectedByWorker(prev => {
      const selected = prev[workerId] || [];
      const exists = selected.some((s: any) => s.id === candidate.id);
      if (exists) return { ...prev, [workerId]: selected.filter((s: any) => s.id !== candidate.id) };
      return { ...prev, [workerId]: [...selected, candidate] };
    });
  }

  async function assignSelected(workerId: string) {
    const selected = selectedByWorker[workerId] || [];
    if (selected.length === 0) return;
    const ok = confirm(`Assign ${selected.length} selected voter(s) to this karyakarta?`);
    if (!ok) return;

    try {
      setSavingWorkerId(workerId);
      setSavingActionByWorker(prev => ({ ...prev, [workerId]: 'assign' }));
      for (const candidate of selected) {
        await patchAssignment(candidate.id, { worker_id: workerId });
      }
      setSelectedByWorker(prev => ({ ...prev, [workerId]: [] }));
      setSearchByWorker(prev => ({ ...prev, [workerId]: '' }));
      setResultsByWorker(prev => ({ ...prev, [workerId]: [] }));
      await fetchWorkers();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign selected voters');
    } finally {
      setSavingWorkerId(null);
      setSavingActionByWorker(prev => ({ ...prev, [workerId]: undefined }));
    }
  }

  async function deleteWorker(workerId: string) {
    const ok = confirm('Delete this karyakarta? / हा कार्यकर्ता हटवायचा?');
    if (!ok) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(apiUrl(`/api/workers?id=${workerId}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      await fetchWorkers();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  }

  let content: ReactNode;
  if (loading) {
    content = <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading workers...</div>;
  } else if (error) {
    content = (
      <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13 }}>
        {error}
      </div>
    );
  } else if (workers.length === 0) {
    content = <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No workers found / कार्यकर्ते आढळले नाहीत.</div>;
  } else {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workers.map(worker => {
          const isOpen = !!expanded[worker.id];
          const selectedCandidates = selectedByWorker[worker.id] || [];
          return (
            <div key={worker.id} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.textHeading }}>{worker.name}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {worker.mobile ? <><Phone size={13} /> {worker.mobile}</> : 'No mobile'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 999, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} /> {worker.assigned_count} assigned
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpanded(prev => ({ ...prev, [worker.id]: !isOpen }))}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: colors.textHeading, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    {isOpen ? <><ChevronUp size={12} /> Hide Voters / मतदार लपवा</> : <><ChevronDown size={12} /> Show Voters / मतदार दाखवा</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(worker); setShowModal(true); }}
                    style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, background: 'white', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Pencil size={12} /> Edit / संपादन
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWorker(worker.id)}
                    style={{ padding: '6px 10px', border: '1px solid #fecaca', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Trash2 size={12} /> Delete / हटवा
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <label htmlFor={`worker-voter-search-${worker.id}`} style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Assign voter to this karyakarta / या कार्यकर्त्यास मतदार जोडा</label>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                      Search and select multiple voters, then click Assign Selected. / एकापेक्षा जास्त मतदार निवडा आणि Assign Selected करा.
                    </div>
                    <input
                      id={`worker-voter-search-${worker.id}`}
                      value={searchByWorker[worker.id] || ''}
                      onChange={e => searchVoters(worker.id, e.target.value)}
                      placeholder="Search voter by name, EPIC or mobile..."
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box' }}
                    />
                    {(resultsByWorker[worker.id] || []).length > 0 && (
                      <div style={{ marginTop: 8, border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', maxHeight: 220, overflowY: 'auto' }}>
                        {(resultsByWorker[worker.id] || []).map((candidate: any) => (
                          <div
                            key={`${worker.id}-${candidate.id}`}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #f1f5f9', background: 'white', cursor: 'pointer', fontSize: 13 }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCandidates.some((s: any) => s.id === candidate.id)}
                              onChange={() => toggleCandidate(worker.id, candidate)}
                              disabled={savingWorkerId === worker.id}
                              aria-label={`Select voter ${candidate.name_english || `${candidate.first_name || ''} ${candidate.surname || ''}`.trim()}`}
                              style={{ marginTop: 2 }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{candidate.name_english || `${candidate.first_name || ''} ${candidate.surname || ''}`.trim()}</div>
                              <div style={{ color: '#64748b', fontSize: 12 }}>{candidate.voter_id || '—'} · {candidate.mobile || 'No mobile'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(searchByWorker[worker.id] || '').trim().length >= 2 && (resultsByWorker[worker.id] || []).length === 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>No matching voters found / जुळणारे मतदार आढळले नाहीत.</div>
                    )}
                    {selectedCandidates.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 12, color: '#334155' }}>{selectedCandidates.length} voter(s) selected / मतदार निवडले</div>
                        <button
                          type="button"
                          onClick={() => assignSelected(worker.id)}
                          disabled={savingWorkerId === worker.id}
                          className="btn-primary"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                        >
                          {savingWorkerId === worker.id && savingActionByWorker[worker.id] === 'assign' ? 'Assigning... / जतन होत आहे' : 'Assign Selected / निवडलेले जोडा'}
                        </button>
                      </div>
                    )}
                  </div>
                  {worker.voters.length === 0 ? (
                    <div style={{ padding: '14px', fontSize: 13, color: '#94a3b8' }}>No voters assigned / मतदार जोडलेले नाहीत.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Voter</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>EPIC</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Mobile</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Village</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {worker.voters.map((voter, idx) => (
                          <tr key={`${worker.id}-${voter.id}-${idx}`} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: colors.textHeading }}>
                              <Link href={`/voter/${voter.id}`} style={{ color: colors.textHeading, textDecoration: 'none' }}>{voter.name || 'Unnamed voter'}</Link>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#334155' }}>{voter.voter_id || '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#334155' }}>{voter.mobile || '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#334155' }}>{voter.village || '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <button
                                type="button"
                                disabled={savingWorkerId === worker.id}
                                onClick={async () => {
                                  const ok = confirm('Remove this voter from this karyakarta? / या कार्यकर्त्यामधून हा मतदार काढायचा का?');
                                  if (!ok) return;
                                  try {
                                    setSavingWorkerId(worker.id);
                                    setSavingActionByWorker(prev => ({ ...prev, [worker.id]: 'remove' }));
                                    setRemovingVoterId(voter.id);
                                    await patchAssignment(voter.id, { worker_id: null });
                                    await fetchWorkers();
                                  } catch (err: any) {
                                    alert(err?.message || 'Failed to remove voter mapping');
                                  } finally {
                                    setSavingWorkerId(null);
                                    setSavingActionByWorker(prev => ({ ...prev, [worker.id]: undefined }));
                                    setRemovingVoterId(null);
                                  }
                                }}
                                style={{ padding: '5px 10px', border: '1px solid #fecaca', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 12, cursor: 'pointer' }}
                              >
                                    {savingWorkerId === worker.id && savingActionByWorker[worker.id] === 'remove' && removingVoterId === voter.id ? 'Removing... / काढले जात आहे' : 'Remove / काढा'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textHeading, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={20} /> Karyakarta / कार्यकर्ता
            </h2>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Worker assignment mapping list / कार्यकर्ता मतदार मॅपिंग यादी</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              Total: {workers.length}
            </div>
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} /> Add Karyakarta / कार्यकर्ता जोडा
            </button>
          </div>
        </div>

        {content}
      </div>
      {showModal && (
        <WorkerModal
          worker={editing}
          onClose={() => setShowModal(false)}
          onSaved={fetchWorkers}
        />
      )}
    </DashboardLayout>
  );
}
