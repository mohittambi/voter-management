import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Lock, UserPlus, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'office_user'>('office_user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isAdmin } = useAuth();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSuccess(`User created successfully! They can now login with ${email}`);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="card" style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Lock size={64} color="#94a3b8" /></div>
          <h2 style={{ margin: '0 0 16px', fontSize: 24 }}>Access Denied</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Only administrators can create new users.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card">
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserPlus size={24} /> Create New User
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
              Add a new user to the voter management system
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="user@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Re-enter password"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label">User Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'office_user')}
                className="input"
              >
                <option value="office_user">Office User</option>
                <option value="admin">Administrator</option>
              </select>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
                {role === 'admin' 
                  ? '✓ Full system access including uploads, services, reports' 
                  : '✓ Can search voters, create service requests, update status'}
              </p>
            </div>

            {error && (
              <div style={{
                padding: 12,
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#991b1b',
                fontSize: 14,
                marginBottom: 20
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} /> {error}</span>
              </div>
            )}

            {success && (
              <div style={{
                padding: 12,
                background: '#d1fae5',
                border: '1px solid #a7f3d0',
                borderRadius: 8,
                color: '#065f46',
                fontSize: 14,
                marginBottom: 20
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> {success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} /> Creating User...</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><UserPlus size={14} /> Create User</span>}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
