import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiUrl } from '../lib/api';
import VoterProfileEditForm from './VoterProfileEditForm';

interface VoterEditDrawerProps {
  voter: any;
  open: boolean;
  onClose: () => void;
  onSaved: (updatedProfile: any) => void;
}

export default function VoterEditDrawer({ voter, open, onClose, onSaved }: VoterEditDrawerProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !voter?.id) return;
    setLoading(true);
    setProfile(null);
    fetch(apiUrl(`/api/voter?id=${voter.id}`))
      .then(r => r.json())
      .then(d => {
        setProfile(d.profile || null);
      })
      .finally(() => setLoading(false));
  }, [open, voter?.id]);

  function handleSave(updatedProfile: any) {
    setSaving(true);
    onSaved(updatedProfile);
    setSaving(false);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 350,
          background: 'rgba(0,0,0,0.35)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          maxWidth: '95vw',
          height: '100vh',
          background: 'white',
          zIndex: 360,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Edit Voter / मतदार संपादन</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
          ) : (
            <VoterProfileEditForm
              voter={voter}
              profile={profile}
              onSave={handleSave}
              onCancel={onClose}
              saving={saving}
            />
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
