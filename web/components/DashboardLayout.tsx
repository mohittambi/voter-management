import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../lib/rbac';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, role, signOut, isAdmin } = useAuth();

  // Define all navigation items with permissions
  const allNavItems = [
    { href: '/', label: 'Dashboard', icon: '📊', permission: null },
    { href: '/upload', label: 'Upload Voters', icon: '📤', permission: 'UPLOAD_VOTERS' as const },
    { href: '/imports', label: 'Import History', icon: '📋', permission: 'UPLOAD_VOTERS' as const },
    { href: '/search', label: 'Search Voters', icon: '🔍', permission: 'SEARCH_VOTERS' as const },
    { href: '/reports', label: 'Reports & Analytics', icon: '📈', permission: 'VIEW_REPORTS' as const },
    { href: '/reports/builder', label: 'Custom Reports', icon: '🔧', permission: 'CREATE_CUSTOM_REPORTS' as const },
    { href: '/services', label: 'Manage Services', icon: '🛠️', permission: 'MANAGE_SERVICES' as const },
    { href: '/signup', label: 'Create User', icon: '👤', permission: 'MANAGE_USERS' as const },
  ];

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => 
    !item.permission || hasPermission(role, item.permission)
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 280,
        background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
        color: 'white',
        padding: '24px 0',
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '0 24px', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}>🗳️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>Voter Portal</h1>
              <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.75, fontWeight: 500 }}>Management System</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: '0 12px' }}>
          {navItems.map(item => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  margin: '4px 0',
                  color: 'white',
                  textDecoration: 'none',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderRadius: 10,
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 14,
                  transition: 'all 0.2s',
                  border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          padding: 16,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>Version</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>MVP v1.0.0</div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 280 }}>
        {/* Header */}
        <header style={{
          background: 'white',
          padding: '20px 32px',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.5px' }}>
                {navItems.find(i => i.href === router.pathname)?.label || 'Dashboard'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* Role Badge */}
              {role && (
                <div style={{
                  padding: '6px 12px',
                  background: isAdmin ? '#dbeafe' : '#f0fdf4',
                  borderRadius: 6,
                  border: isAdmin ? '1px solid #93c5fd' : '1px solid #bbf7d0'
                }}>
                  <span style={{ 
                    fontSize: 12, 
                    color: isAdmin ? '#1e40af' : '#166534', 
                    fontWeight: 600 
                  }}>
                    {isAdmin ? '👑 Admin' : '👤 Office User'}
                  </span>
                </div>
              )}

              {/* User Info */}
              <div style={{
                padding: '8px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                  {user?.email || 'Guest'}
                </span>
              </div>

              {/* Logout Button */}
              {user && (
                <button
                  onClick={signOut}
                  style={{
                    padding: '8px 16px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#991b1b',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fecaca';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                >
                  🚪 Logout
                </button>
              )}

              {/* Avatar */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                {user?.email?.charAt(0).toUpperCase() || 'G'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: 32, maxWidth: 1400 }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          padding: '24px 32px',
          borderTop: '1px solid #e2e8f0',
          background: 'white',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#64748b' }}>
            <div>© 2026 Voter Management Portal. All rights reserved.</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy</a>
              <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Terms</a>
              <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
