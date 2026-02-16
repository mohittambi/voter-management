import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'office_user')[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: Readonly<ProtectedRouteProps>) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push('/login');
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.push('/');
    }
  }, [user, role, loading, requireAuth, allowedRoles, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 700 }}>Access Denied</h2>
          <p style={{ margin: '0 0 24px', color: '#64748b' }}>
            You don't have permission to access this page.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
