import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Home() {
  const statsCards = [
    { label: 'Total Voters', value: '—', icon: '👥', color: '#dbeafe', iconColor: '#1e40af' },
    { label: 'Total Imports', value: '—', icon: '📥', color: '#dcfce7', iconColor: '#166534' },
    { label: 'Families', value: '—', icon: '👨‍👩‍👧‍👦', color: '#fef3c7', iconColor: '#92400e' },
    { label: 'Active Users', value: '1', icon: '✅', color: '#e0e7ff', iconColor: '#4338ca' },
  ];

  const quickActions = [
    {
      href: '/upload',
      icon: '📤',
      title: 'Upload Voter List',
      description: 'Import Excel or CSV files',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      href: '/search',
      icon: '🔍',
      title: 'Search Voters',
      description: 'Find voter profiles quickly',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      href: '/imports',
      icon: '📋',
      title: 'View Imports',
      description: 'Import history & downloads',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="card fade-in" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        marginBottom: 32,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-1px' }}>
            Welcome back, Admin 👋
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 16, opacity: 0.9 }}>
            Here's what's happening with your voter management system today.
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: -40,
          bottom: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        {statsCards.map((stat, i) => (
          <div key={i} className="card fade-in" style={{
            animationDelay: `${i * 0.1}s`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.label}
                </p>
                <h3 style={{ margin: '12px 0 0', fontSize: 36, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px' }}>
                  {stat.value}
                </h3>
              </div>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28
              }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 20, color: '#0f172a', fontWeight: 700 }}>Quick Actions</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20
        }}>
          {quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="fade-in"
              style={{
                display: 'block',
                background: action.gradient,
                borderRadius: 16,
                padding: 28,
                textDecoration: 'none',
                color: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden',
                animationDelay: `${i * 0.1}s`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{action.icon}</div>
              <h4 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>{action.title}</h4>
              <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.9 }}>{action.description}</p>
              <div style={{
                position: 'absolute',
                right: 20,
                bottom: 20,
                fontSize: 24,
                opacity: 0.5
              }}>→</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card fade-in" style={{ animationDelay: '0.4s' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#0f172a', fontWeight: 700 }}>Recent Activity</h3>
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p style={{ margin: 0 }}>No recent activity to display</p>
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>Activity will appear here once you start using the system</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

