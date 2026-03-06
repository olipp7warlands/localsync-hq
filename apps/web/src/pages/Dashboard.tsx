import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats } from '@localsync/shared';
import StatsBar from '../components/StatsBar';
import AlertFeed, { AlertWithLocation } from '../components/AlertFeed';
import HealthScoreBadge from '../components/HealthScoreBadge';
import AddLocationModal from '../components/AddLocationModal';

export default function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);

  const isMounted = useRef(true);

  async function loadDashboard() {
    try {
      const res = await api.get<DashboardStats>('/api/dashboard');
      if (isMounted.current) setData(res);
    } catch (err) {
      if (isMounted.current) setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  async function handleResolveAlert(id: string) {
    // AlertFeed already called the API — just refresh
    void id;
    if (isMounted.current) await loadDashboard();
  }

  useEffect(() => {
    isMounted.current = true;
    loadDashboard();
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: '#9CA3AF', fontSize: '14px' }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return <div style={{ color: '#DC2626', fontSize: '14px' }}>{error}</div>;
  }

  if (!data) return null;

  const avgColor = data.avgHealthScore >= 80 ? '#16A34A' : data.avgHealthScore >= 50 ? '#D97706' : '#DC2626';
  const alertColor = data.openAlerts > 0 ? '#DC2626' : '#16A34A';

  const stats = [
    { label: 'Total Locations', value: data.totalLocations, href: '/locations', addButton: true },
    { label: 'Avg Health Score', value: `${data.avgHealthScore}%`, color: avgColor, href: '/locations' },
    { label: 'Open Alerts', value: data.openAlerts, color: alertColor, href: '/alerts' },
    { label: 'Synced Listings', value: data.syncedListings, sub: `${data.driftedListings} drifted`, href: '/locations' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
          Overview of all locations and listings
        </p>
      </div>

      <StatsBar stats={stats} onAddLocation={() => setShowAddLocation(true)} />
      {showAddLocation && (
        <AddLocationModal
          onClose={() => setShowAddLocation(false)}
          onCreated={loadDashboard}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Location Health */}
        <div
          className="fade-in-up fade-in-up-0"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', opacity: 0 }}
        >
          <h2 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '16px' }}>
            Location Health
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {data.locationHealth.map((loc) => (
              <Link
                key={loc.id}
                to={`/locations/${loc.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none', transition: 'background 150ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#EFF6FF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ minWidth: 0, flex: 1, marginRight: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loc.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
                    {loc.city}, {loc.state}
                  </div>
                </div>
                <div style={{ width: '110px', flexShrink: 0 }}>
                  <HealthScoreBadge score={loc.healthScore} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div
          className="fade-in-up fade-in-up-1"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', opacity: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280' }}>
              Recent Alerts
            </h2>
            <Link to="/alerts" style={{ color: '#2563EB', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <AlertFeed
            alerts={data.recentAlerts as AlertWithLocation[]}
            onResolve={handleResolveAlert}
          />
        </div>
      </div>
    </div>
  );
}
