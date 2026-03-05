import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { apiUrl } from '../lib/api';

interface AddVoterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVoterModal({ onClose, onSuccess }: AddVoterModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    surname: '',
    voter_id: '',
    name_marathi: '',
    name_english: '',
    booth_number: '',
    serial_number: '',
    caste: '',
    age: '',
    gender: '',
    dob: '',
    mobile: '',
    mobile_secondary: '',
    email: '',
    village: '',
    address_marathi: '',
    address_english: '',
    aadhaar_masked: '',
    caste_category: '',
    ration_card_type: '',
    education: '',
    occupation: '',
    anniversary_date: '',
    social_ids: { facebook: '', instagram: '', twitter: '', whatsapp: '', youtube: '', linkedin: '' },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.voter_id.trim()) return setError('Voter ID is required / मतदार ID आवश्यक');
    setSubmitting(true);
    setError('');
    try {
      const socialIds = form.social_ids
        ? Object.fromEntries(
            Object.entries(form.social_ids).filter(([, v]) => v != null && String(v).trim())
          )
        : null;
      const body = {
        ...form,
        social_ids: socialIds && Object.keys(socialIds).length ? socialIds : null,
      };
      const res = await fetch(apiUrl('/api/voters/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create voter');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create voter / मतदार तयार करणे अयशस्वी');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Voter / मतदार जोडा</h3>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Manually add a new voter</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#991b1b', fontSize: 13 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div>
              <label style={labelStyle}>First Name / नाव *</label>
              <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} style={inputStyle} placeholder="First name" />
            </div>
            <div>
              <label style={labelStyle}>Middle Name / मधले नाव</label>
              <input value={form.middle_name} onChange={e => setForm(f => ({ ...f, middle_name: e.target.value }))} style={inputStyle} placeholder="Middle name" />
            </div>
            <div>
              <label style={labelStyle}>Surname / आडनाव</label>
              <input value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} style={inputStyle} placeholder="Surname" />
            </div>
            <div>
              <label style={labelStyle}>Voter ID / मतदार ओळखपत्र *</label>
              <input value={form.voter_id} onChange={e => setForm(f => ({ ...f, voter_id: e.target.value }))} style={inputStyle} placeholder="EPIC number" required />
            </div>
            <div>
              <label style={labelStyle}>Name (Marathi) / मराठी नाव</label>
              <input value={form.name_marathi} onChange={e => setForm(f => ({ ...f, name_marathi: e.target.value }))} style={inputStyle} placeholder="मराठी नाव" />
            </div>
            <div>
              <label style={labelStyle}>Name (English)</label>
              <input value={form.name_english} onChange={e => setForm(f => ({ ...f, name_english: e.target.value }))} style={inputStyle} placeholder="English name" />
            </div>
            <div>
              <label style={labelStyle}>Booth Number / बुथ</label>
              <input type="number" value={form.booth_number} onChange={e => setForm(f => ({ ...f, booth_number: e.target.value }))} style={inputStyle} placeholder="Booth" />
            </div>
            <div>
              <label style={labelStyle}>Serial Number</label>
              <input type="number" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} style={inputStyle} placeholder="Serial" />
            </div>
            <div>
              <label style={labelStyle}>Caste / जात</label>
              <input value={form.caste} onChange={e => setForm(f => ({ ...f, caste: e.target.value }))} style={inputStyle} placeholder="Caste" />
            </div>
            <div>
              <label style={labelStyle}>Age / वय</label>
              <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={inputStyle} placeholder="Age" />
            </div>
            <div>
              <label style={labelStyle}>Gender / लिंग</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={inputStyle}>
                <option value="">Select</option>
                <option value="M">Male / पुरुष</option>
                <option value="F">Female / महिला</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date of Birth / जन्मतारीख</label>
              <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mobile / मोबाईल</label>
              <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} style={inputStyle} placeholder="10-digit mobile" />
            </div>
            <div>
              <label style={labelStyle}>Mobile (Secondary)</label>
              <input value={form.mobile_secondary} onChange={e => setForm(f => ({ ...f, mobile_secondary: e.target.value }))} style={inputStyle} placeholder="Alt mobile" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="email@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Aadhaar Number / आधार *</label>
              <input value={form.aadhaar_masked} onChange={e => setForm(f => ({ ...f, aadhaar_masked: e.target.value }))} style={inputStyle} placeholder="XXXX-XXXX-1234" />
            </div>
            <div>
              <label style={labelStyle}>Village / गाव</label>
              <input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} style={inputStyle} placeholder="Village" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Caste Category / जात वर्ग *</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                {['SC', 'ST', 'OBC', 'Open'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                    <input type="radio" name="caste_category" checked={form.caste_category === opt} onChange={() => setForm(f => ({ ...f, caste_category: opt }))} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Ration Card Type / रेशन कार्ड प्रकार</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                {['White', 'Yellow', 'Orange', 'NA'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                    <input type="radio" name="ration_card_type" checked={form.ration_card_type === opt} onChange={() => setForm(f => ({ ...f, ration_card_type: opt }))} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Education / शिक्षण *</label>
              <input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} style={inputStyle} placeholder="e.g. 10th Pass, Graduate" />
            </div>
            <div>
              <label style={labelStyle}>Occupation / व्यवसाय *</label>
              <input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} style={inputStyle} placeholder="e.g. Farmer, Business" />
            </div>
            <div>
              <label style={labelStyle}>Anniversary Date / वर्धापन दिन</label>
              <input type="date" value={form.anniversary_date} onChange={e => setForm(f => ({ ...f, anniversary_date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Social Media IDs</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 6 }}>
                {(['facebook', 'instagram', 'twitter', 'whatsapp', 'youtube', 'linkedin'] as const).map(platform => (
                  <div key={platform}>
                    <input
                      value={form.social_ids[platform]}
                      onChange={e => setForm(f => ({ ...f, social_ids: { ...f.social_ids, [platform]: e.target.value } }))}
                      style={inputStyle}
                      placeholder={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Address (Marathi) / पत्ता</label>
              <textarea value={form.address_marathi} onChange={e => setForm(f => ({ ...f, address_marathi: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} placeholder="पत्ता" rows={2} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Address (English)</label>
              <textarea value={form.address_english} onChange={e => setForm(f => ({ ...f, address_english: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} placeholder="Address" rows={2} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
              Cancel / रद्द करा
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
              {submitting ? 'Creating...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={14} /> Add Voter / मतदार जोडा</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
