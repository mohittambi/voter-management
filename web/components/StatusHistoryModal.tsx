import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { colors, SR_STATUS_CONFIG } from '../lib/colors';

const STATUS_STYLES = SR_STATUS_CONFIG;

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: colors.pageBg, color: colors.textSecondary, border: colors.borderLight };
  return (
    <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

interface StatusHistoryModalProps {
  requestId: string;
  onClose: () => void;
}

export default function StatusHistoryModal({ requestId, onClose }: StatusHistoryModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/service-requests/${requestId}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [requestId]);

  const logs: any[] = data?.service_request_status_logs || [];
  const sorted = [...logs].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, padding: 28, width: 460, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Status History</h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>स्थिती बदल नोंदी · Request #{requestId.slice(0, 8)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Loading... / लोड होत आहे...</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No history found / इतिहास सापडला नाही</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sorted.map((log, i) => {
              const s = STATUS_STYLES[log.status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
              return (
                <div key={log.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < sorted.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, border: `2px solid ${s.border}`, flexShrink: 0 }} />
                    {i < sorted.length - 1 && <div style={{ width: 2, flex: 1, background: '#e2e8f0', margin: '4px 0' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <StatusBadge status={log.status} />
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                      {new Date(log.changed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>by {log.changed_by?.slice(0, 8) || 'system'}...</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
