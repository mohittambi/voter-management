import { Save } from 'lucide-react';

interface VoterProfileEditFormProps {
  voter: { id: string };
  profile: any;
  onSave: (updatedProfile: any) => void;
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
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = {
      voter_id: voter.id,
      dob: formData.get('dob') || null,
      mobile: formData.get('mobile') || null,
      aadhaar_masked: formData.get('aadhaar_masked') || null,
      email: formData.get('email') || null,
      address_marathi: formData.get('address_marathi') || null,
      address_english: formData.get('address_english') || null,
      social_ids: {
        facebook: formData.get('facebook') || null,
        instagram: formData.get('instagram') || null,
      },
    };

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated = await res.json();
      onSave(updated);
    } else {
      alert('Update failed / अपडेट अयशस्वी');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
