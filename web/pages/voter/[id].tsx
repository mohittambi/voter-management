import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import FamilyLinkModal from '../../src/components/FamilyLinkModal';
import FamilyMoveModal from '../../src/components/FamilyMoveModal';
import VoterProfileEditForm from '../../components/VoterProfileEditForm';
import NewRequestModal from '../../components/NewRequestModal';
import StatusHistoryModal from '../../components/StatusHistoryModal';
import {
  User, Smartphone, ClipboardList, Home, HardHat, CreditCard, Vote as VoteIcon,
  CheckCircle, AlertTriangle, Pencil, Plus, Crown, Users, UserCheck,
  Briefcase, MapPin, XCircle, Phone, FileText, Clock, X,
  ArrowRightLeft, FileDown, Paperclip, Trash2,
  Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle, ShieldCheck,
} from 'lucide-react';
import { supabase } from '../../contexts/AuthContext';
import { colors, SR_STATUS_CONFIG } from '../../lib/colors';
import { apiUrl } from '../../lib/api';

type TabType = 'personal' | 'contact' | 'administrative' | 'family' | 'assignment' | 'servicerequests' | 'documents';

function DocumentsTab({ voterId, documents, loading, onRefresh }: { voterId: string; documents: any[]; loading: boolean; onRefresh: () => void }) {
  const [uploadType, setUploadType] = useState('Aadhaar Card');
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const form = new FormData();
      form.append('file', file);
      form.append('voter_id', voterId);
      form.append('document_type', uploadType);
      const res = await fetch(apiUrl('/api/voter-documents'), {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onRefresh();
      e.target.value = '';
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(apiUrl(`/api/voter-documents/${docId}`), {
      method: 'DELETE',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    if (res.ok) onRefresh();
    else alert('Delete failed');
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Paperclip size={20} /> दस्तऐवज / Documents
      </h2>
      <div style={{ marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={uploadType} onChange={e => setUploadType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: 'white' }}>
          <option value="Aadhaar Card">Aadhaar Card</option>
          <option value="PAN Card">PAN Card</option>
          <option value="Other">Other</option>
        </select>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} disabled={uploading} style={{ fontSize: 13 }} />
        {uploading && <span style={{ fontSize: 13, color: '#64748b' }}>Uploading...</span>}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#F5F7FA', borderRadius: 8 }}>
          <Paperclip size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>No documents uploaded yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documents.map((d: any) => (
            <div key={d.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#e0f2fe', color: '#0369a1', marginRight: 8 }}>{d.document_type}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{d.file_name || 'Document'}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    const res = await fetch(apiUrl(`/api/voter-documents/${d.id}`), { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} });
                    if (!res.ok) return;
                    const { url } = await res.json();
                    if (url) window.open(url, '_blank');
                  }}
                  style={{ padding: '6px 12px', border: '1px solid #bbf7d0', borderRadius: 6, background: '#f0fdf4', color: '#059669', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Download
                </button>
                <button onClick={() => handleDelete(d.id)} style={{ padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 6, background: '#fee2e2', color: '#dc2626', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VoterProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [voter, setVoter] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [familyInfo, setFamilyInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveModalMember, setMoveModalMember] = useState<any>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [historyRequestId, setHistoryRequestId] = useState<string | null>(null);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [srLoading, setSrLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Fetch voter and profile
    fetch(apiUrl(`/api/voter?id=${id}`))
      .then(r => r.json())
      .then(d => {
        setVoter(d.master || null);
        setProfile(d.profile || null);
      });
    
    // Fetch family info
    fetch(apiUrl(`/api/family/info?voter_id=${id}`))
      .then(r => r.json())
      .then(d => {
        setFamilyInfo(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function onFamilyLinked() {
    setShowLinkModal(false);
    fetch(apiUrl(`/api/family/info?voter_id=${id}`))
      .then(r => r.json())
      .then(d => setFamilyInfo(d));
  }

  function onFamilyMoved() {
    setShowMoveModal(false);
    setMoveModalMember(null);
    fetch(apiUrl(`/api/family/info?voter_id=${id}`))
      .then(r => r.json())
      .then(d => setFamilyInfo(d));
  }

  function openMoveModal(member?: any) {
    setMoveModalMember(member || null);
    setShowMoveModal(true);
  }

  useEffect(() => {
    if (!id) return;
    setSrLoading(true);
    fetch(apiUrl(`/api/service-requests?voter_id=${id}&pageSize=100`))
      .then(r => r.json())
      .then(d => setServiceRequests(d.data || []))
      .finally(() => setSrLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== 'documents') return;
    setDocsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetch(apiUrl(`/api/voter-documents?voter_id=${id}`), { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
        .then(r => r.json())
        .then(d => setDocuments(Array.isArray(d) ? d : []))
        .catch(() => setDocuments([]))
        .finally(() => setDocsLoading(false));
    });
  }, [id, activeTab]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ margin: 0, color: '#64748b' }}>Loading voter profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!voter) {
    return (
      <DashboardLayout>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><XCircle size={48} color="#ef4444" /></div>
          <p style={{ margin: 0, color: '#64748b' }}>Voter not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'personal', label: 'वैयक्तिक माहिती / Personal', icon: <User size={17} /> },
    { id: 'contact', label: 'संपर्क / Contact', icon: <Smartphone size={17} /> },
    { id: 'administrative', label: 'प्रशासकीय / Administrative', icon: <ClipboardList size={17} /> },
    { id: 'family', label: 'कुटुंब / Family', icon: <Home size={17} /> },
    { id: 'assignment', label: 'नियुक्ती / Assignment', icon: <HardHat size={17} /> },
    { id: 'documents', label: 'दस्तऐवज / Documents', icon: <Paperclip size={17} /> },
    { id: 'servicerequests', label: 'सेवा विनंत्या / Service Requests', icon: <FileText size={17} /> },
  ];

  return (
    <DashboardLayout>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#64748b' }}>
        <Link href="/voters" style={{ color: '#0D47A1', textDecoration: 'none' }}>मतदार / Voters</Link>
        <span>→</span>
        <span style={{ color: '#0f172a', fontWeight: 500 }}>
          {voter.name_marathi || `${voter.first_name || ''} ${voter.surname || ''}`}
        </span>
      </div>

      {/* Profile Header Card */}
      <div className="card fade-in" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(13, 71, 161, 0.3)'
          }}>
            {voter.name_marathi ? voter.name_marathi.charAt(0) : (voter.first_name?.charAt(0) || 'V')}
          </div>

          {/* Header Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {voter.name_marathi || `${voter.first_name || ''} ${voter.middle_name || ''} ${voter.surname || ''}`}
            </h1>
            {voter.name_english && voter.name_marathi && (
              <p style={{ margin: '4px 0 0', fontSize: 16, color: '#64748b' }}>
                {voter.name_english}
              </p>
            )}
            <div style={{ margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge badge-info" style={{ fontSize: 14, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <CreditCard size={13} /> {voter.voter_id}
              </span>
              {voter.booth_number && (
                <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <VoteIcon size={12} /> Booth {voter.booth_number}
                </span>
              )}
              {voter.age && (
                <span className="badge" style={{ background: '#f3e8ff', color: '#6b21a8', fontSize: 13 }}>
                  {voter.age} years
                </span>
              )}
              {voter.gender && (
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: 13 }}>
                  {voter.gender === 'M' ? 'Male' : voter.gender === 'F' ? 'Female' : voter.gender}
                </span>
              )}
              {profile?.status && (
                <span className={`badge ${profile.status === 'Active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {profile.status === 'Active' ? <><CheckCircle size={12} /> Active</> : <><AlertTriangle size={12} /> {profile.status}</>}
                </span>
              )}
              {profile?.data_validated && (
                <span className="badge badge-success" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} /> Validated
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {activeTab !== 'family' && (
              <button
                onClick={() => setShowEditModal(true)}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            {!profile?.data_validated && (
              <button
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  const res = await fetch(apiUrl(`/api/voter-profiles/${id}`), {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
                    body: JSON.stringify({ data_validated: true }),
                  });
                  if (res.ok) setProfile((p: any) => (p ? { ...p, data_validated: true } : p));
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: '1px solid #86efac', borderRadius: 8, background: '#dcfce7', color: '#166534', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                <ShieldCheck size={14} /> Validate Data
              </button>
            )}
            <a href={apiUrl(`/api/voter-profiles/${id}/birthday-pdf`)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: '1px solid #fcd34d', borderRadius: 8, background: '#fef9c3', color: '#92400e', fontSize: 14, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
              <FileText size={14} /> Birthday Letter / वाढदिवस पत्र
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="card" style={{ padding: 0, marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #e2e8f0',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                flex: 1,
                minWidth: 180,
                padding: '16px 24px',
                background: activeTab === tab.id ? 'white' : 'transparent',
                border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #0D47A1' : '3px solid transparent',
              color: activeTab === tab.id ? '#0D47A1' : '#424242',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card fade-in">
        {/* Personal Info Tab */}
        {activeTab === 'personal' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={20} /> वैयक्तिक माहिती / Personal Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <div>
                <label className="label">मराठी नाव / Marathi Name</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.name_marathi || '—'}
                </p>
              </div>
              <div>
                <label className="label">English Name</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.name_english || '—'}
                </p>
              </div>
              <div>
                <label className="label">आडनाव / Surname</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.surname_marathi || voter.surname || '—'}
                </p>
              </div>
              <div>
                <label className="label">मतदार ओळखपत्र / Voter ID</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.voter_id}
                </p>
              </div>
              <div>
                <label className="label">जन्मतारीख / Date of Birth</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {profile?.dob || '—'}
                </p>
              </div>
              <div>
                <label className="label">वय / Age</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.age || '—'}
                </p>
              </div>
              <div>
                <label className="label">लिंग / Gender</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.gender === 'M' ? 'पुरुष / Male' : voter.gender === 'F' ? 'स्त्री / Female' : voter.gender || '—'}
                </p>
              </div>
              <div>
                <label className="label">जात / Caste</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.caste || '—'}
                </p>
              </div>
              <div>
                <label className="label">जात वर्ग / Caste Category</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {profile?.caste_category || '—'}
                </p>
              </div>
              <div>
                <label className="label">शिक्षण / Education</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {profile?.education || '—'}
                </p>
              </div>
              <div>
                <label className="label">व्यवसाय / Occupation</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {profile?.occupation || '—'}
                </p>
              </div>
              <div>
                <label className="label">वर्धापन दिन / Anniversary Date</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {profile?.anniversary_date || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={20} /> संपर्क माहिती / Contact Information
              </h2>
              <button onClick={() => setShowEditModal(true)} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={14} /> Edit Contact
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                <div>
                  <label className="label">मोबाईल नंबर / Mobile Number</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.mobile || '—'}
                  </p>
                </div>
                <div>
                  <label className="label">Mobile (Secondary)</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.mobile_secondary || '—'}
                  </p>
                </div>
                <div>
                  <label className="label">ईमेल / Email</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.email || '—'}
                  </p>
                </div>
                <div>
                  <label className="label">रेशन कार्ड प्रकार / Ration Card Type</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.ration_card_type || '—'}
                  </p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">पत्ता (मराठी) / Address (Marathi)</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.address_marathi || '—'}
                  </p>
                </div>
                <div>
                  <label className="label">आधार (मास्क केलेला) / Aadhaar (Masked)</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.aadhaar_masked || '—'}
                  </p>
                </div>
                <div>
                  <label className="label">Social Media</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                    {profile?.social_ids?.facebook && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Facebook size={14} /> {profile.social_ids.facebook}
                      </span>
                    )}
                    {profile?.social_ids?.instagram && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Instagram size={14} /> {profile.social_ids.instagram}
                      </span>
                    )}
                    {profile?.social_ids?.twitter && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Twitter size={14} /> {profile.social_ids.twitter}
                      </span>
                    )}
                    {profile?.social_ids?.whatsapp && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MessageCircle size={14} /> {profile.social_ids.whatsapp}
                      </span>
                    )}
                    {profile?.social_ids?.youtube && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Youtube size={14} /> {profile.social_ids.youtube}
                      </span>
                    )}
                    {profile?.social_ids?.linkedin && (
                      <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Linkedin size={14} /> {profile.social_ids.linkedin}
                      </span>
                    )}
                    {!profile?.social_ids?.facebook && !profile?.social_ids?.instagram && !profile?.social_ids?.twitter && !profile?.social_ids?.whatsapp && !profile?.social_ids?.youtube && !profile?.social_ids?.linkedin && (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* Administrative Tab */}
        {activeTab === 'administrative' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={20} /> प्रशासकीय माहिती / Administrative Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <div>
                <label className="label">बुथ नंबर / Booth Number</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.booth_number || '—'}
                </p>
              </div>
              <div>
                <label className="label">अनुक्रमांक / Serial Number</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.serial_number || '—'}
                </p>
              </div>
              <div>
                <label className="label">विधानसभा मतदारसंघ / Assembly Constituency</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {voter.assembly_constituency || '—'}
                </p>
              </div>
              <div>
                <label className="label">स्थिती / Status</label>
                <p style={{ margin: '4px 0 0' }}>
                  <span className={`badge ${profile?.status === 'Active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {profile?.status === 'Active' ? <><CheckCircle size={12} /> Active</> : profile?.status || '—'}
                  </span>
                </p>
              </div>
              <div>
                <label className="label">गाव / Village</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {profile?.village || '—'}
                  {profile?.villages?.new_gan && (
                    <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>
                      (गण: {profile.villages.new_gan})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="label">नवीन गट / New Gat</label>
                <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                  {profile?.villages?.new_gat || '—'}
                </p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label">आयात तारीख / Import Date</label>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
                  {new Date(voter.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Home size={20} /> कुटुंब माहिती / Family Information
              </h2>
              <button onClick={() => setShowLinkModal(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Link Family Member
              </button>
            </div>

            {familyInfo?.role === 'head' && (
              <div>
                <div style={{ 
                  padding: 16, 
                  background: '#E3F0FF', 
                  borderRadius: 8, 
                  border: '1px solid #90CAF9',
                  marginBottom: 20 
                }}>
                  <p style={{ margin: 0, color: '#0D47A1', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Crown size={14} /> कुटुंब प्रमुख / Family Head
                  </p>
                </div>

                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                  कुटुंब सदस्य / Family Members ({familyInfo.members?.length || 0})
                </h3>

                {familyInfo.members && familyInfo.members.length > 0 ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {familyInfo.members.map((member: any) => (
                      <div
                        key={member.id}
                        className="card"
                        style={{
                          padding: 16,
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <Link
                          href={`/voter/${member.id}`}
                          style={{
                            flex: 1,
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                              {member.name}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                              नाते / Relationship: <span className="badge badge-info">{member.relationship_marathi || member.relationship}</span>
                            </p>
                          </div>
                        </Link>
                        <button
                          onClick={e => { e.preventDefault(); openMoveModal(member); }}
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #0D47A1',
                            borderRadius: 8,
                            background: '#E3F0FF',
                            color: '#0D47A1',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <ArrowRightLeft size={12} /> Move
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 32, background: '#F5F7FA', borderRadius: 8 }}>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><Users size={32} color="#94a3b8" /></div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>No family members linked yet</p>
                  </div>
                )}
              </div>
            )}

            {familyInfo?.role === 'member' && familyInfo.head && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                    कुटुंब प्रमुख / Family Head
                  </h3>
                  <button onClick={() => openMoveModal()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #0D47A1', borderRadius: 8, background: '#E3F0FF', color: '#0D47A1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <ArrowRightLeft size={14} /> Move to Another Family
                  </button>
                </div>
                <Link
                  href={`/voter/${familyInfo.head.id}`}
                  className="card"
                  style={{
                    padding: 16,
                    textDecoration: 'none',
                    color: 'inherit',
                    marginBottom: 24,
                    display: 'block',
                    transition: 'all 0.2s',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Crown size={14} /> {familyInfo.head.name}
                      </p>
                    </div>
                    <div style={{ color: '#0D47A1', fontSize: 20 }}>→</div>
                  </div>
                </Link>

                {familyInfo.siblings && familyInfo.siblings.length > 0 && (
                  <>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                      इतर सदस्य / Other Members ({familyInfo.siblings.length})
                    </h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {familyInfo.siblings.map((sibling: any) => (
                        <Link
                          key={sibling.id}
                          href={`/voter/${sibling.id}`}
                          className="card"
                          style={{
                            padding: 16,
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                                {sibling.name}
                              </p>
                              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                                नाते: <span className="badge badge-info">{sibling.relationship_marathi || sibling.relationship}</span>
                              </p>
                            </div>
                            <div style={{ color: '#0D47A1', fontSize: 20 }}>→</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {familyInfo?.role === 'none' && (
              <div style={{ textAlign: 'center', padding: 48, background: '#F5F7FA', borderRadius: 8 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Users size={48} color="#94a3b8" /></div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>कुटुंब जोडलेले नाही / No Family Linked</h3>
                <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
                  Link this voter to a family or mark as family head
                </p>
                <button onClick={() => setShowLinkModal(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Link Family Member
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentsTab
            voterId={id as string}
            documents={documents}
            loading={docsLoading}
            onRefresh={() => {
              supabase.auth.getSession().then(({ data: { session } }) => {
                fetch(apiUrl(`/api/voter-documents?voter_id=${id}`), { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
                  .then(r => r.json())
                  .then(d => setDocuments(Array.isArray(d) ? d : []));
              });
            }}
          />
        )}

        {/* Service Requests Tab */}
        {activeTab === 'servicerequests' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} /> सेवा विनंत्या / Service Requests
              </h2>
              <button onClick={() => setShowNewRequestModal(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> New Request / नवीन विनंती
              </button>
            </div>
            {srLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
            ) : serviceRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, background: '#F5F7FA', borderRadius: 8 }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><FileText size={40} color="#94a3b8" /></div>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14 }}>No service requests for this voter</p>
                <button onClick={() => setShowNewRequestModal(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> New Request / नवीन विनंती
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {serviceRequests.map((r: any) => {
                  const s = SR_STATUS_CONFIG[r.status] || { bg: colors.pageBg, color: colors.textSecondary, border: colors.borderLight };
                  return (
                    <div key={r.id} className="card" style={{ padding: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>#{r.id.slice(0, 8)}</span>
                            <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{r.status}</span>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{r.service_type_name}</div>
                          {r.notes && <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{r.notes}</div>}
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                            Raised: {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · Updated: {new Date(r.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button onClick={() => window.open(apiUrl(`/api/service-requests/${r.id}/pdf`), '_blank', 'noopener')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: '1px solid #bbf7d0', borderRadius: 6, background: '#f0fdf4', color: '#059669', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            <FileDown size={12} /> PDF
                          </button>
                          <button onClick={() => setHistoryRequestId(r.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: '1px solid #bae6fd', borderRadius: 6, background: '#f0f9ff', color: '#0369a1', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                            <Clock size={12} /> History / इतिहास
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Assignment Tab */}
        {activeTab === 'assignment' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HardHat size={20} /> नियुक्ती माहिती / Assignment Information
            </h2>
            <div style={{ display: 'grid', gap: 24 }}>
              {/* Worker Info */}
              <div className="card" style={{ background: '#E0F2F1', border: '1px solid #80CBC4' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#00695C', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserCheck size={16} /> कार्यकर्ता / Karayakarta (Non-paid freelance)
                </h3>
                {profile?.workers ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label className="label">नाव / Name</label>
                      <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                        {profile.workers.name}
                      </p>
                    </div>
                    {profile.workers.mobile && (
                      <div>
                        <label className="label">मोबाइल नं / Mobile</label>
                        <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={14} /> {profile.workers.mobile}
                        </p>
                      </div>
                    )}
                    {profile.workers.epic_number && (
                      <div>
                        <label className="label">EPIC Number</label>
                        <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                          {profile.workers.epic_number}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#00695C' }}>No worker assigned</p>
                )}
              </div>

              {/* Employee Info */}
              <div className="card" style={{ background: '#E3F0FF', border: '1px solid #90CAF9' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0D47A1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={16} /> कर्मचारी / Employee
                </h3>
                {profile?.employees ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label className="label">नाव / Name</label>
                      <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                        {profile.employees.name}
                      </p>
                    </div>
                    <div>
                      <label className="label">कर्मचारी आय डी / Employee ID</label>
                        <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CreditCard size={14} /> {profile.employees.employee_id}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#0D47A1' }}>No employee assigned</p>
                )}
              </div>

              {/* Village Info */}
              <div className="card" style={{ background: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} /> स्थान माहिती / Location Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label className="label">गाव / Village</label>
                    <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                      {profile?.village || '—'}
                    </p>
                  </div>
                  {profile?.villages?.new_gan && (
                    <div>
                      <label className="label">नवीन गण / New Gan</label>
                      <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                        {profile.villages.new_gan}
                      </p>
                    </div>
                  )}
                  {profile?.villages?.new_gat && (
                    <div>
                      <label className="label">नवीन गट / New Gat</label>
                      <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                        {profile.villages.new_gat}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowEditModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 28, width: 640, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Edit Profile / प्रोफाइल संपादित करा</h3>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Update voter contact and profile details</div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
            </div>
            <VoterProfileEditForm
              voter={voter}
              profile={profile}
              onSave={(updated) => {
                setProfile(updated);
                setShowEditModal(false);
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}
      {showLinkModal && <FamilyLinkModal voter={voter} onClose={onFamilyLinked} />}
      {showMoveModal && (
        <FamilyMoveModal
          voter={moveModalMember || voter}
          currentHeadName={moveModalMember ? (voter?.name_marathi || `${voter?.first_name || ''} ${voter?.surname || ''}`.trim() || '') : (familyInfo?.head?.name || '')}
          currentHeadId={moveModalMember ? voter?.id : familyInfo?.head?.id}
          onClose={() => { setShowMoveModal(false); setMoveModalMember(null); }}
          onMoved={onFamilyMoved}
        />
      )}
      {showNewRequestModal && (
        <NewRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onCreated={() => {
            setShowNewRequestModal(false);
            fetch(apiUrl(`/api/service-requests?voter_id=${id}&pageSize=100`)).then(r => r.json()).then(d => setServiceRequests(d.data || []));
          }}
          initialVoter={{ id: voter.id, voter_id: voter.voter_id, name_english: voter.name_english || `${voter.first_name || ''} ${voter.surname || ''}`.trim(), first_name: voter.first_name, surname: voter.surname, village: profile?.village }}
          lockVoter={true}
        />
      )}
      {historyRequestId && <StatusHistoryModal requestId={historyRequestId} onClose={() => setHistoryRequestId(null)} />}
    </DashboardLayout>
  );
}
