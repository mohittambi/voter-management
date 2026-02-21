import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import FamilyLinkModal from '../../src/components/FamilyLinkModal';
import {
  User, Smartphone, ClipboardList, Home, HardHat, CreditCard, Vote as VoteIcon,
  CheckCircle, AlertTriangle, Pencil, Save, Link2, Plus, Crown, Users, UserCheck,
  Briefcase, MapPin, XCircle, Phone,
} from 'lucide-react';

type TabType = 'personal' | 'contact' | 'administrative' | 'family' | 'assignment';

export default function VoterProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [voter, setVoter] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [familyInfo, setFamilyInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [editing, setEditing] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Fetch voter and profile
    fetch(`/api/voter?id=${id}`)
      .then(r => r.json())
      .then(d => {
        setVoter(d.master || null);
        setProfile(d.profile || null);
      });
    
    // Fetch family info
    fetch(`/api/family/info?voter_id=${id}`)
      .then(r => r.json())
      .then(d => {
        setFamilyInfo(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function saveProfile(e: any) {
    e.preventDefault();
    const form = new FormData(e.target);
    const body: any = {
      voter_id: voter.id,
      dob: form.get('dob'),
      mobile: form.get('mobile'),
      aadhaar_masked: form.get('aadhaar_masked'),
      email: form.get('email'),
      social_ids: { facebook: form.get('facebook'), instagram: form.get('instagram') }
    };
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setEditing(false);
    } else {
      alert('Update failed');
    }
  }

  function onFamilyLinked() {
    setShowLinkModal(false);
    fetch(`/api/family/info?voter_id=${id}`)
      .then(r => r.json())
      .then(d => setFamilyInfo(d));
  }

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
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            {!editing && activeTab !== 'family' && (
              <button onClick={() => setEditing(true)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Pencil size={14} /> Edit
              </button>
            )}
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
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setEditing(false);
              }}
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
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Pencil size={14} /> Edit Contact
                </button>
              )}
            </div>

            {!editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                <div>
                  <label className="label">मोबाईल नंबर / Mobile Number</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.mobile || '—'}
                  </p>
                </div>
                <div>
                  <label className="label">ईमेल / Email</label>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#0f172a', fontWeight: 500 }}>
                    {profile?.email || '—'}
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
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    {profile?.social_ids?.facebook && (
                      <span className="badge badge-info">fb: {profile.social_ids.facebook}</span>
                    )}
                    {profile?.social_ids?.instagram && (
                      <span className="badge badge-info">ig: {profile.social_ids.instagram}</span>
                    )}
                    {!profile?.social_ids?.facebook && !profile?.social_ids?.instagram && <span style={{ color: '#64748b' }}>—</span>}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={saveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                  <div>
                    <label className="label">Date of Birth</label>
                    <input name="dob" defaultValue={profile?.dob || ''} type="date" className="input" />
                  </div>
                  <div>
                    <label className="label">Mobile Number</label>
                    <input name="mobile" defaultValue={profile?.mobile || ''} className="input" placeholder="10-digit mobile" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input name="email" defaultValue={profile?.email || ''} type="email" className="input" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="label">Aadhaar (Masked)</label>
                    <input name="aadhaar_masked" defaultValue={profile?.aadhaar_masked || ''} className="input" placeholder="XXXX-XXXX-1234" />
                  </div>
                  <div>
                    <label className="label">Facebook</label>
                    <input name="facebook" defaultValue={profile?.social_ids?.facebook || ''} className="input" placeholder="Username" />
                  </div>
                  <div>
                    <label className="label">Instagram</label>
                    <input name="instagram" defaultValue={profile?.social_ids?.instagram || ''} className="input" placeholder="Username" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </form>
            )}
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
                      <Link
                        key={member.id}
                        href={`/voter/${member.id}`}
                        className="card"
                        style={{
                          padding: 16,
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                              {member.name}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                              नाते / Relationship: <span className="badge badge-info">{member.relationship_marathi || member.relationship}</span>
                            </p>
                          </div>
                          <div style={{ color: '#0D47A1', fontSize: 20 }}>→</div>
                        </div>
                      </Link>
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
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
                  कुटुंब प्रमुख / Family Head
                </h3>
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
                  <UserCheck size={16} /> कार्यकर्ता / Karyakarta (Worker)
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

      {showLinkModal && <FamilyLinkModal voter={voter} onClose={onFamilyLinked} />}
    </DashboardLayout>
  );
}
