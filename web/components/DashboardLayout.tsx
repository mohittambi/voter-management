import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../lib/colors';
import { LayoutDashboard, Users, ClipboardList, Settings, Vote, Crown, User, LogOut, Menu, X, Cake } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',                 label: 'Dashboard',        labelMr: 'डॅशबोर्ड',    icon: <LayoutDashboard size={19} />, adminOnly: false },
  { href: '/voters',           label: 'Voters',           labelMr: 'मतदार',       icon: <Users size={19} />,           adminOnly: false },
  { href: '/service-requests', label: 'Service Requests', labelMr: 'सेवा विनंत्या', icon: <ClipboardList size={19} />,  adminOnly: false },
  { href: '/birthdays',        label: 'Birthdays',        labelMr: 'जन्मदिन',     icon: <Cake size={19} />,            adminOnly: false },
  { href: '/admin',            label: 'Admin',            labelMr: 'प्रशासन',     icon: <Settings size={19} />,        adminOnly: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, role, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  function isActive(href: string) {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  }

  const sidebarBg = colors.primary; // #0D47A1 — Congress Blue

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.pageBg }}>

      {/* ── Sidebar (desktop) ── */}
      <aside style={{
        width: 240,
        background: sidebarBg,
        color: colors.textOnPrimary,
        padding: '24px 0',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }} className="sidebar-desktop">

        {/* Logo */}
        <div style={{ padding: '0 20px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}><Vote size={22} color="white" /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>Voter Portal</div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>मतदार व्यवस्थापन</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0 10px', flex: 1 }}>
          {navItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                margin: '3px 0',
                color: colors.textOnPrimary,
                textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                borderRadius: 10,
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                transition: 'background 0.15s',
                borderLeft: active ? `3px solid rgba(255,255,255,0.9)` : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                <div>
                  <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.2 }}>{item.labelMr}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 14px 0', borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 16 }}>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>Logged in as</div>
          <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all', marginBottom: 8 }}>{user?.email || 'Guest'}</div>
          <div style={{ marginBottom: 14 }}>
            <span style={{
              padding: '3px 10px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{isAdmin ? <><Crown size={11} /> Admin</> : <><User size={11} /> Office User</>}</span>
            </span>
          </div>
          {user && (
            <button onClick={signOut} style={{
              width: '100%',
              padding: '9px',
              background: 'rgba(183,28,28,0.2)',
              border: '1px solid rgba(183,28,28,0.35)',
              borderRadius: 8,
              color: '#FFCDD2',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(183,28,28,0.32)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(183,28,28,0.2)'}>
              <LogOut size={14} /> Logout
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header style={{
        display: 'none',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 200,
        background: sidebarBg,
        color: colors.textOnPrimary,
        padding: '12px 16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Vote size={22} color="white" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Voter Portal</div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>मतदार व्यवस्थापन</div>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(o => !o)} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
          color: 'white', width: 40, height: 40,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex' }}>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{
            position: 'relative', width: 260,
            background: sidebarBg,
            color: colors.textOnPrimary,
            padding: '80px 10px 24px',
            display: 'flex', flexDirection: 'column', height: '100%',
          }}>
            <nav style={{ flex: 1 }}>
              {navItems.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', margin: '3px 0',
                    color: colors.textOnPrimary, textDecoration: 'none',
                    background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderRadius: 10, fontWeight: active ? 700 : 500, fontSize: 15,
                    borderLeft: active ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                    <div>
                      <div>{item.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{item.labelMr}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16, marginTop: 16 }}>
              <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>{user?.email}</div>
              {user && (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} style={{
                  width: '100%', padding: '10px',
                  background: 'rgba(183,28,28,0.2)', border: '1px solid rgba(183,28,28,0.35)',
                  borderRadius: 8, color: '#FFCDD2', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}><LogOut size={14} /> Logout</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, marginLeft: 240, minWidth: 0 }} className="main-content">

        {/* Page header */}
        <header style={{
          background: colors.surface,
          padding: '14px 28px',
          borderBottom: `1px solid ${colors.borderLight}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: colors.textPrimary, fontWeight: 700, letterSpacing: '-0.3px' }}>
                {navItems.find(i => isActive(i.href))?.label || 'Dashboard'}
                {' '}
                <span style={{ fontSize: 13, color: colors.textDisabled, fontWeight: 400 }}>
                  / {navItems.find(i => isActive(i.href))?.labelMr}
                </span>
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.textDisabled }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: isAdmin ? colors.primaryLight : colors.accentLight,
                color: isAdmin ? colors.primary : colors.accent,
                border: `1px solid ${isAdmin ? '#90CAF9' : '#80CBC4'}`,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{isAdmin ? <><Crown size={11} /> Admin</> : <><User size={11} /> Office User</>}</span>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: colors.primary,
                color: colors.textOnPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 15,
              }}>
                {user?.email?.charAt(0).toUpperCase() || 'G'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '24px 28px', maxWidth: 1400, minHeight: 'calc(100vh - 69px)' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header   { display: flex !important; }
          .main-content    { margin-left: 0 !important; padding-top: 64px; }
        }
      `}</style>
    </div>
  );
}
