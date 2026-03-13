import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { colors, SR_STATUS_CONFIG } from '../lib/colors';
import { apiUrl } from '../lib/api';
import React from 'react';
import { Users, FileText, Home, UserCheck, MapPin, ClipboardList, User, Plus, Settings, AlertTriangle } from 'lucide-react';

const SR_STATUSES = Object.keys(SR_STATUS_CONFIG);

function SkeletonCard() {
  return (
    <div style={{ background: colors.surface, borderRadius: 12, padding: '18px 20px', border: `1px solid ${colors.borderLight}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ height: 11, width: '55%', background: '#E0E0E0', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 26, width: '38%', background: '#E0E0E0', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
    </div>
  );
}

function StatCard({ label, labelMr, value, icon, iconBg, iconColor, numColor, link }: {
  label: string; labelMr: string; value: number | string; icon: React.ReactNode;
  iconBg: string; iconColor: string; numColor: string; link?: string;
}) {
  const content = (
    <div style={{
      background: colors.surface, borderRadius: 12, padding: '16px 18px',
      border: `1px solid ${colors.borderLight}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: link ? 'pointer' : 'default',
      textDecoration: 'none', color: 'inherit',
    }}
    onMouseEnter={e => { if (link) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,71,161,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: colors.textDisabled, marginBottom: 4 }}>{labelMr}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: numColor, letterSpacing: '-1px', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>
      </div>
    </div>
  );
  return link ? <Link href={link} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/dashboard/stats'))
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => { setError('Could not load stats / आकडेवारी लोड करता आली नाही'); setLoading(false); });
  }, []);

  const totalSR = stats?.serviceRequests?.total || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
          {error && (
          <div style={{ background: '#FFEBEE', border: `1px solid #EF9A9A`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: colors.error, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* ── Section A: Voter Metrics ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Voter Metrics</h2>
            <span style={{ fontSize: 13, color: colors.textDisabled }}>/ मतदार आकडेवारी</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />) : (<>
              <StatCard label="Total Voters"          labelMr="एकूण मतदार"       value={stats?.voters?.total ?? 0}    icon={<Users size={22} />}      iconBg={colors.primaryLight} iconColor={colors.primary}   numColor={colors.primary}   link="/voters" />
              <StatCard label="Voter Profiles"        labelMr="मतदार प्रोफाइल"  value={stats?.voters?.profiles ?? 0} icon={<FileText size={22} />}   iconBg="#EDE7F6"             iconColor="#4527A0"          numColor="#4527A0"          link="/voters" />
              <StatCard label="Families"              labelMr="कुटुंबे"          value={stats?.voters?.families ?? 0} icon={<Home size={22} />}       iconBg="#E0F2F1"             iconColor={colors.accent}   numColor={colors.accent}    link="/voters" />
              <StatCard label="Staff / Karayakartas" labelMr="कार्यकर्ते"      value={stats?.voters?.workers ?? 0}  icon={<UserCheck size={22} />}  iconBg="#E8F5E9"             iconColor={colors.success}   numColor={colors.success}   link="/voters?view=staff" />
              <StatCard label="Villages"              labelMr="गावे"             value={stats?.voters?.villages ?? 0} icon={<MapPin size={22} />}     iconBg="#FFF8E1"             iconColor="#E65100"          numColor="#E65100"          />
            </>)}
          </div>
        </div>

        {/* ── Section B: Service Request Metrics ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Service Request Metrics</h2>
            <span style={{ fontSize: 13, color: colors.textDisabled }}>/ सेवा विनंती आकडेवारी</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
            {loading ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />) : (<>
              <StatCard label="Total Requests"    labelMr="एकूण विनंत्या"         value={stats?.serviceRequests?.total ?? 0}          icon={<ClipboardList size={22} />} iconBg="#E3F2FD" iconColor={colors.statusSubmitted} numColor={colors.statusSubmitted} link="/service-requests" />
              <StatCard label="Unique Requesters" labelMr="वेगळे विनंती कर्ते"   value={stats?.serviceRequests?.uniqueRaisers ?? 0}   icon={<User size={22} />}          iconBg="#FFF8E1" iconColor={colors.warning}          numColor={colors.warning}          link="/service-requests" />
            </>)}
          </div>

          {/* Status breakdown */}
          <div style={{ background: colors.surface, borderRadius: 12, padding: '18px 20px', border: `1px solid ${colors.borderLight}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, marginBottom: 14 }}>
              Status Breakdown / स्थिती तपशील
            </div>
            {loading ? (
              <div style={{ height: 56, background: '#F5F7FA', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
            ) : (
              <>
                {totalSR > 0 && (
                  <div style={{ display: 'flex', height: 7, borderRadius: 8, overflow: 'hidden', marginBottom: 14, gap: 1 }}>
                    {SR_STATUSES.map(s => {
                      const cfg = SR_STATUS_CONFIG[s];
                      const count = stats?.serviceRequests?.statusBreakdown?.[s] || 0;
                      const pct = totalSR > 0 ? (count / totalSR) * 100 : 0;
                      return pct > 0 ? <div key={s} style={{ width: `${pct}%`, background: cfg.color, borderRadius: 2, minWidth: 3 }} title={`${s}: ${count}`} /> : null;
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SR_STATUSES.map(s => {
                    const cfg = SR_STATUS_CONFIG[s];
                    const count = stats?.serviceRequests?.statusBreakdown?.[s] || 0;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: cfg.bg, borderRadius: 20, border: `1px solid ${cfg.border}`, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ color: colors.textPrimary, fontWeight: 500 }}>{s}</span>
                        <span style={{ fontWeight: 700, color: cfg.color }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Top service types */}
          {!loading && stats?.serviceRequests?.topServiceTypes?.length > 0 && (
            <div style={{ background: colors.surface, borderRadius: 12, padding: '18px 20px', border: `1px solid ${colors.borderLight}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, marginBottom: 12 }}>Top Service Types / सर्वाधिक विनंत्या</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.serviceRequests.topServiceTypes.map((st: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: [colors.primaryLight, '#E3F2FD', '#EDE7F6'][i] || '#F5F7FA',
                      color: [colors.primary, colors.statusSubmitted, colors.statusShared][i] || colors.textSecondary,
                      fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>{st.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.textSecondary }}>{st.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Quick Actions</h2>
            <span style={{ fontSize: 13, color: colors.textDisabled }}>/ जलद क्रिया</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { href: '/voters',           icon: <Users size={22} />,       label: 'View All Voters',   labelMr: 'सर्व मतदार पहा',    bg: colors.primary },
              { href: '/service-requests', icon: <ClipboardList size={22} />, label: 'Service Requests', labelMr: 'सेवा विनंत्या',     bg: colors.statusShared },
              { href: '/service-requests', icon: <Plus size={22} />,        label: 'New Request',       labelMr: 'नवीन विनंती',       bg: colors.accent },
              { href: '/admin',            icon: <Settings size={22} />,    label: 'Admin Panel',       labelMr: 'प्रशासन',           bg: colors.statusClosed },
            ].map((a, i) => (
              <Link key={i} href={a.href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 18px', background: a.bg, borderRadius: 12,
                textDecoration: 'none', color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)'; }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>{a.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>{a.labelMr}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
