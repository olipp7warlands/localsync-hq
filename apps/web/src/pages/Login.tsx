import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api/client';

interface AuthResponse { token: string; }

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@brightsmile.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
      setToken(res.token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px' }}>
              ↻
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>LocalSync HQ</span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Sign in to your account</p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {error && (
            <div style={{ color: '#DC2626', fontSize: '13px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#111827', fontFamily: "'Inter', sans-serif", outline: 'none', transition: 'border-color 150ms' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#111827', fontFamily: "'Inter', sans-serif", outline: 'none', transition: 'border-color 150ms' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? '#93C5FD' : '#2563EB', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', fontFamily: "'Inter', sans-serif", cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 150ms' }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#1D4ED8'; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2563EB'; }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
