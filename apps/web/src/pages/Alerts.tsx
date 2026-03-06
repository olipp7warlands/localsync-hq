import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { api } from '../api/client';
import AlertFeed, { AlertWithLocation } from '../components/AlertFeed';

const SEVERITY_OPTIONS = ['', 'critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS = ['open', 'resolved'];

const selectStyle: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  color: '#374151',
  fontSize: '13px',
  fontFamily: "'Inter', sans-serif",
  fontWeight: 500,
  padding: '7px 12px',
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 150ms',
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: '28px',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (severityFilter) params.set('severity', severityFilter);
      const data = await api.get<AlertWithLocation[]>(`/api/alerts?${params}`);
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(_id: string) {
    // AlertFeed already called the API — just refresh
    await load();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Alerts</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
            {loading ? '...' : `${alerts.length} alert${alerts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All statuses'}</option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All severities'}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
        {loading ? (
          <div style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px' }}>{error}</div>
            <button
              onClick={load}
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#374151', fontSize: '13px', fontWeight: 500, padding: '7px 16px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 150ms' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLElement).style.color = '#2563EB'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
            >
              Retry
            </button>
          </div>
        ) : (
          <AlertFeed alerts={alerts} onResolve={handleResolve} />
        )}
      </div>
    </div>
  );
}
