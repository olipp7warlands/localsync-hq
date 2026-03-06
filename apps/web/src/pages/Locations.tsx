import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import HealthScoreBadge from '../components/HealthScoreBadge';

// City coordinates for map thumbnails
const CITY_COORDS: Record<string, [number, number]> = {
  'Chicago':     [41.8781, -87.6298],
  'Oak Park':    [41.8850, -87.7845],
  'Naperville':  [41.7508, -87.7698],
  'Evanston':    [42.0450, -87.6877],
  'Schaumburg':  [42.0334, -88.0834],
  'Aurora':      [41.7606, -88.3201],
  'Joliet':      [41.5250, -88.0817],
  'Rockford':    [42.2711, -89.0940],
  'Peoria':      [40.6936, -89.5890],
  'Springfield': [39.7817, -89.6501],
  'Champaign':   [40.1164, -88.2434],
  'Bloomington': [40.4842, -88.9937],
  'Decatur':     [39.8403, -88.9548],
};

// Avatar color from business name hash
const AVATAR_PALETTE = ['#7C3AED', '#2563EB', '#16A34A', '#D97706', '#DB2777', '#0891B2'];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// Map thumbnail: iframe embed or styled placeholder
function MapThumbnail({ city }: { city: string }) {
  const coords = CITY_COORDS[city];

  if (!coords) {
    return (
      <div style={{
        width: '100%', height: '120px',
        background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 500, color: '#3B82F6' }}>{city}</span>
      </div>
    );
  }

  const [lat, lng] = coords;
  const d = 0.008;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <iframe
      src={src}
      title={`${city} map`}
      loading="lazy"
      style={{ width: '100%', height: '120px', border: 'none', display: 'block' }}
    />
  );
}

// Platform icon definitions
const PLATFORM_ICONS: Record<string, { bg: string; color: string; label: string }> = {
  yelp:       { bg: '#FF1A1A', color: '#FFFFFF', label: 'y' },
  apple_maps: { bg: '#1C1C1E', color: '#FFFFFF', label: '⌘' },
  bing:       { bg: '#008373', color: '#FFFFFF', label: 'B' },
  facebook:   { bg: '#1877F2', color: '#FFFFFF', label: 'f' },
};

function PlatformIcon({ platform, status }: { platform: string; status: string }) {
  const opacity = status === 'synced' ? 1 : status === 'drifted' ? 0.4 : status === 'error' ? 1 : 0.15;
  const isError = status === 'error';
  const errorRing = isError ? '2px solid #DC2626' : undefined;

  // Google: multicolor conic-gradient border with white inner circle
  if (platform === 'google') {
    return (
      <div
        title="google: synced"
        style={{
          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
          padding: '2px',
          background: isError
            ? '#DC2626'
            : 'conic-gradient(#4285F4 0deg 90deg, #EA4335 90deg 180deg, #FBBC05 180deg 270deg, #34A853 270deg 360deg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%', background: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: '#4285F4',
          fontFamily: "'Inter', sans-serif",
        }}>
          G
        </div>
      </div>
    );
  }

  const icon = PLATFORM_ICONS[platform] ?? { bg: '#9CA3AF', color: '#FFFFFF', label: platform[0].toUpperCase() };

  return (
    <div
      title={`${platform}: ${status}`}
      style={{
        width: '24px', height: '24px', borderRadius: '50%',
        background: icon.bg,
        border: errorRing,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: platform === 'apple_maps' ? '11px' : '13px',
        fontWeight: 700, color: icon.color, opacity, flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      {icon.label}
    </div>
  );
}

interface ListingStatus {
  platform: string;
  status: string;
}

interface LocationRow {
  id: string;
  name: string;
  city: string;
  state: string;
  healthScore: number;
  _count: { listings: number; alerts: number };
  listings: ListingStatus[];
}

function LocationCard({ loc, index }: { loc: LocationRow; index: number }) {
  const [hovered, setHovered] = useState(false);
  const color = avatarColor(loc.name);

  return (
    <Link
      to={`/locations/${loc.id}`}
      className={`fade-in-up fade-in-up-${Math.min(index, 14)}`}
      style={{
        display: 'block',
        background: '#FFFFFF',
        border: `1px solid ${hovered ? '#2563EB' : '#E5E7EB'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'border-color 150ms, box-shadow 150ms',
        opacity: 0,
        boxShadow: hovered ? '0 4px 16px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Map thumbnail */}
      <div style={{ position: 'relative', height: '120px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
        <MapThumbnail city={loc.city} />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.18))', pointerEvents: 'none' }} />
        {/* Business avatar */}
        <div style={{
          position: 'absolute', bottom: '10px', left: '12px',
          width: '36px', height: '36px', borderRadius: '50%',
          background: color, border: '2px solid #FFFFFF',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF', fontSize: '16px', fontWeight: 700,
        }}>
          {loc.name[0].toUpperCase()}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
            {loc.name}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            {loc.city}, {loc.state}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <HealthScoreBadge score={loc.healthScore} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {loc.listings.map((l) => (
              <PlatformIcon key={l.platform} platform={l.platform} status={l.status} />
            ))}
          </div>
          {loc._count.alerts > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '20px', padding: '2px 8px' }}>
              {loc._count.alerts} alert{loc._count.alerts !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Locations() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<LocationRow[]>('/api/locations');
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
        Loading locations...
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Locations</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
          {locations.length} total locations
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {locations.map((loc, i) => (
          <LocationCard key={loc.id} loc={loc} index={i} />
        ))}
      </div>
    </div>
  );
}
