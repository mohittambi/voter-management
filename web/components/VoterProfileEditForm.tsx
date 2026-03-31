import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { apiUrl } from '../lib/api';

export type ProfileUpdateResult = { profile: any; master: any | null };

interface VoterProfileEditFormProps {
  voter: {
    id: string;
    voter_id?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    surname?: string | null;
    name_english?: string | null;
    name_marathi?: string | null;
    first_name_marathi?: string | null;
    surname_marathi?: string | null;
  };
  profile: any;
  onSave: (result: ProfileUpdateResult) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function VoterProfileEditForm({
  voter,
  profile,
  onSave,
  onCancel,
  saving = false,
}: VoterProfileEditFormProps) {
  const [workers, setWorkers] = useState<{ id: string; name: string; mobile?: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string; employee_id: string }[]>([]);

  useEffect(() => {
    fetch(apiUrl('/api/workers')).then(r => r.json()).then(d => setWorkers(Array.isArray(d) ? d : []));
    fetch(apiUrl('/api/admin/employees')).then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = {
      voter_id: voter.id,
      epic_number: formData.get('epic_number'),
      first_name: formData.get('first_name'),
      middle_name: formData.get('middle_name'),
      surname: formData.get('surname'),
      name_english: formData.get('name_english'),
      name_marathi: formData.get('name_marathi'),
      first_name_marathi: formData.get('first_name_marathi'),
      surname_marathi: formData.get('surname_marathi'),
      dob: formData.get('dob') || null,
      mobile: formData.get('mobile') || null,
      mobile_secondary: formData.get('mobile_secondary') || null,
      aadhaar_masked: formData.get('aadhaar_masked') || null,
      email: formData.get('email') || null,
      address_marathi: formData.get('address_marathi') || null,
      address_english: formData.get('address_english') || null,
      education: formData.get('education') || null,
      occupation: formData.get('occupation') || null,
      caste_category: formData.get('caste_category') || null,
      ration_card_type: formData.get('ration_card_type') || null,
      anniversary_date: formData.get('anniversary_date') || null,
      worker_id: formData.get('worker_id') || null,
      employee_id: formData.get('employee_id') || null,
      social_ids: {
        facebook: formData.get('facebook') || null,
        instagram: formData.get('instagram') || null,
        twitter: formData.get('twitter') || null,
        whatsapp: formData.get('whatsapp') || null,
        youtube: formData.get('youtube') || null,
        linkedin: formData.get('linkedin') || null,
      },
    };

    const res = await fetch(apiUrl('/api/profile/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      onSave(data);
    } else {
      alert('Update failed / अपडेट अयशस्वी');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Name / नाव</h4>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Voter ID (EPIC) / मतदार ओळखपत्र</label>
          <input
            name="epic_number"
            className="input"
            defaultValue={voter.voter_id || ''}
            placeholder="e.g. ABC1234567"
            style={{ fontFamily: 'monospace' }}
          />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Imported rows without EPIC use a placeholder like <code style={{ fontSize: 11 }}>NOEPIC-R…</code> — replace
            with the real EPIC when you have it.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Full name (English)</label>
            <input name="name_english" className="input" defaultValue={voter.name_english || ''} placeholder="English full name" />
          </div>
          <div>
            <label className="label">First name (English)</label>
            <input name="first_name" className="input" defaultValue={voter.first_name || ''} />
          </div>
          <div>
            <label className="label">Middle name (English)</label>
            <input name="middle_name" className="input" defaultValue={voter.middle_name || ''} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Surname (English)</label>
            <input name="surname" className="input" defaultValue={voter.surname || ''} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Full name (Marathi) / मराठी पूर्ण नाव</label>
            <input name="name_marathi" className="input" defaultValue={voter.name_marathi || ''} dir="auto" />
          </div>
          <div>
            <label className="label">First name (Marathi)</label>
            <input name="first_name_marathi" className="input" defaultValue={voter.first_name_marathi || ''} dir="auto" />
          </div>
          <div>
            <label className="label">Surname (Marathi) / आडनाव</label>
            <input name="surname_marathi" className="input" defaultValue={voter.surname_marathi || ''} dir="auto" />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        <div>
          <label className="label">Date of Birth / जन्मतारीख</label>
          <input
            name="dob"
            type="date"
            defaultValue={profile?.dob || ''}
            className="input"
          />
        </div>
        <div>
          <label className="label">Mobile Number / मोबाईल</label>
          <input
            name="mobile"
            defaultValue={profile?.mobile || ''}
            className="input"
            placeholder="10-digit mobile"
          />
        </div>
        <div>
          <label className="label">Mobile (Secondary)</label>
          <input
            name="mobile_secondary"
            defaultValue={profile?.mobile_secondary || ''}
            className="input"
            placeholder="Alt mobile"
          />
        </div>
        <div>
          <label className="label">Email / ईमेल</label>
          <input
            name="email"
            type="email"
            defaultValue={profile?.email || ''}
            className="input"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="label">Aadhaar (Masked) / आधार</label>
          <input
            name="aadhaar_masked"
            defaultValue={profile?.aadhaar_masked || ''}
            className="input"
            placeholder="XXXX-XXXX-1234"
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Caste Category / जात वर्ग</label>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
            {['SC', 'ST', 'OBC', 'Open'].map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" name="caste_category" value={opt} defaultChecked={profile?.caste_category === opt} />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Ration Card Type / रेशन कार्ड प्रकार</label>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
            {['White', 'Yellow', 'Orange', 'NA'].map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" name="ration_card_type" value={opt} defaultChecked={profile?.ration_card_type === opt} />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Education / शिक्षण</label>
          <input
            name="education"
            defaultValue={profile?.education || ''}
            className="input"
            placeholder="e.g. 10th Pass, Graduate"
          />
        </div>
        <div>
          <label className="label">Occupation / व्यवसाय</label>
          <input
            name="occupation"
            defaultValue={profile?.occupation || ''}
            className="input"
            placeholder="e.g. Farmer, Business"
          />
        </div>
        <div>
          <label className="label">Anniversary Date / वर्धापन दिन</label>
          <input
            name="anniversary_date"
            type="date"
            defaultValue={profile?.anniversary_date || ''}
            className="input"
          />
        </div>
        <div>
          <label className="label">कार्यकर्ता / Party Worker (Karayakarta)</label>
          <select name="worker_id" className="input" defaultValue={profile?.worker_id ?? ''}>
            <option value="">None / निवडा</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.name}{w.mobile ? ` · ${w.mobile}` : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">कर्मचारी / Office Staff (Employee)</label>
          <select name="employee_id" className="input" defaultValue={profile?.employee_id ?? ''}>
            <option value="">None / निवडा</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} · {emp.employee_id}</option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Address (Marathi) / पत्ता (मराठी)</label>
          <textarea
            name="address_marathi"
            defaultValue={profile?.address_marathi || ''}
            className="input"
            placeholder="पत्ता"
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Address (English)</label>
          <textarea
            name="address_english"
            defaultValue={profile?.address_english || ''}
            className="input"
            placeholder="Address"
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label className="label">Facebook</label>
          <input
            name="facebook"
            defaultValue={profile?.social_ids?.facebook || ''}
            className="input"
            placeholder="Username"
          />
        </div>
        <div>
          <label className="label">Instagram</label>
          <input
            name="instagram"
            defaultValue={profile?.social_ids?.instagram || ''}
            className="input"
            placeholder="Username"
          />
        </div>
        <div>
          <label className="label">Twitter / X</label>
          <input
            name="twitter"
            defaultValue={profile?.social_ids?.twitter || ''}
            className="input"
            placeholder="Username"
          />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={profile?.social_ids?.whatsapp || ''}
            className="input"
            placeholder="Number or username"
          />
        </div>
        <div>
          <label className="label">YouTube</label>
          <input
            name="youtube"
            defaultValue={profile?.social_ids?.youtube || ''}
            className="input"
            placeholder="Channel or username"
          />
        </div>
        <div>
          <label className="label">LinkedIn</label>
          <input
            name="linkedin"
            defaultValue={profile?.social_ids?.linkedin || ''}
            className="input"
            placeholder="Profile URL or username"
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel / रद्द करा
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Save size={14} /> {saving ? 'Saving...' : 'Save Changes / बदल जतन करा'}
        </button>
      </div>
    </form>
  );
}
