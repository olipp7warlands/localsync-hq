import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api/client';

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconLocations = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconAlerts = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const links = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard },
  { to: '/locations', label: 'Locations', Icon: IconLocations },
  { to: '/alerts', label: 'Alerts', Icon: IconAlerts },
];

function NavItem({ to, label, Icon, badge }: { to: string; label: string; Icon: () => JSX.Element; badge?: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: isActive ? '#EFF6FF' : hovered ? '#F9FAFB' : 'transparent',
        color: isActive ? '#2563EB' : hovered ? '#374151' : '#6B7280',
        textDecoration: 'none',
        fontWeight: isActive ? 500 : 400,
        fontSize: '14px',
        transition: 'all 150ms',
        marginBottom: '2px',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon />
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '20px', padding: '1px 6px', lineHeight: '18px' }}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const [openAlerts, setOpenAlerts] = useState(0);

  useEffect(() => {
    // Fetch open alert count on mount
    api.get<{ id: string }[]>('/api/alerts?status=open')
      .then((alerts) => setOpenAlerts(alerts.length))
      .catch(() => {});

    // Decrement when an alert is resolved anywhere in the app
    const handleResolved = () => setOpenAlerts((n) => Math.max(0, n - 1));
    window.addEventListener('localsync:alertResolved', handleResolved);
    return () => window.removeEventListener('localsync:alertResolved', handleResolved);
  }, []);

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <aside style={{ width: '240px', minWidth: '240px', background: '#FFFFFF', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '17px', flexShrink: 0 }}>
            ↻
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827', letterSpacing: '-0.01em' }}>LocalSync HQ</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>Listing Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px' }}>
        {links.map((link) => (
          <NavItem
            key={link.to}
            to={link.to}
            label={link.label}
            Icon={link.Icon}
            badge={link.to === '/alerts' ? openAlerts : undefined}
          />
        ))}
      </nav>

      {/* User / sign out */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
            A
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>Admin</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>admin@brightsmile.com</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ width: '100%', background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', color: '#6B7280', fontSize: '13px', fontFamily: "'Inter', sans-serif", padding: '6px 0', transition: 'all 150ms' }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#DC2626'; b.style.color = '#DC2626'; }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#E5E7EB'; b.style.color = '#6B7280'; }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
