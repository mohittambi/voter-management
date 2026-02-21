import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Vote, AlertTriangle, Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #0D47A1 0%, #1565C0 50%, #00796B 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 48,
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #0D47A1, #1565C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(13,71,161,0.3)' }}>
              <Vote size={40} color="white" />
            </div>
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Voter Portal
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
            Sign in to continue
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
              placeholder="admin@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', fontSize: 16, padding: '14px 24px' }}
          >
            {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Loader2 size={16} /> Signing in...</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><LogIn size={16} /> Sign In</span>}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
          <p style={{ margin: 0 }}>
            Need access? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
