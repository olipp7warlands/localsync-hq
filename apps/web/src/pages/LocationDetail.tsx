import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import HealthScoreBadge from '../components/HealthScoreBadge';

interface ListingRow {
  id: string;
  locationId: string;
  platform: string;
  status: string;
  data: Record<string, unknown>;
  driftFields: string[];
  lastSyncedAt: string | null;
}

interface LocationWithListings {
  id: string;
  name: string;
  city: string;
  state: string;
  healthScore: number;
  sourceOfTruth: Record<string, unknown>;
  listings: ListingRow[];
}

interface SOTForm {
  name: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  categories: string;
  hours: Record<string, string>;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  synced:  { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Synced' },
  drifted: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Drifted' },
  error:   { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Error' },
  pending: { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', label: 'Pending' },
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sotToForm(sot: Record<string, unknown>): SOTForm {
  const hours = (sot.hours ?? {}) as Record<string, string>;
  const cats = Array.isArray(sot.categories) ? (sot.categories as string[]).join(', ') : '';
  return {
    name: String(sot.name ?? ''),
    phone: String(sot.phone ?? ''),
    address: String(sot.address ?? ''),
    website: String(sot.website ?? ''),
    description: String(sot.description ?? ''),
    categories: cats,
    hours: { ...hours },
  };
}

function formToSOT(form: SOTForm, original: Record<string, unknown>): Record<string, unknown> {
  return {
    ...original,
    name: form.name,
    phone: form.phone,
    address: form.address,
    website: form.website,
    description: form.description,
    categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
    hours: form.hours,
  };
}

const inputStyle: CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  padding: '7px 10px',
  fontSize: '13px',
  color: '#111827',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
};

function SOTField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: '#374151', wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<LocationWithListings | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [editingSOT, setEditingSOT] = useState(false);
  const [sotForm, setSotForm] = useState<SOTForm | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await api.get<LocationWithListings>(`/api/locations/${id}`);
    setLocation(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  function startEdit() {
    if (!location) return;
    setSotForm(sotToForm(location.sourceOfTruth));
    setEditingSOT(true);
  }

  function cancelEdit() {
    setEditingSOT(false);
    setSotForm(null);
  }

  async function handleSaveSOT() {
    if (!sotForm || !location) return;
    setSaving(true);
    try {
      const updated = formToSOT(sotForm, location.sourceOfTruth);
      await api.patch(`/api/locations/${id}`, { sourceOfTruth: updated });
      setEditingSOT(false);
      setSotForm(null);
      await load();
    } catch {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleScan() {
    setScanning(true);
    try {
      await api.post(`/api/locations/${id}/scan`);
      await new Promise((r) => setTimeout(r, 2000));
      await load();
    } finally {
      setScanning(false);
    }
  }

  async function handleSync(platform: string) {
    setSyncing(platform);
    try {
      await api.post(`/api/locations/${id}/sync/${platform}`);
      await new Promise((r) => setTimeout(r, 1500));
      await load();
    } finally {
      setSyncing(null);
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    try {
      await api.post(`/api/locations/${id}/sync`);
      await new Promise((r) => setTimeout(r, 2000));
      await load();
    } finally {
      setSyncingAll(false);
    }
  }

  if (loading) {
    return <div style={{ color: '#9CA3AF', fontSize: '14px' }}>Loading...</div>;
  }
  if (!location) {
    return <div style={{ color: '#DC2626', fontSize: '14px' }}>Location not found</div>;
  }

  const sot = location.sourceOfTruth as Record<string, unknown>;
  const hours = (sot.hours ?? {}) as Record<string, string>;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
        <Link to="/locations" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 150ms' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#2563EB'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
        >
          Locations
        </Link>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ color: '#111827', fontWeight: 500 }}>{location.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
              {location.name}
            </h1>
            <div style={{ width: '120px' }}>
              <HealthScoreBadge score={location.healthScore} />
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            {location.city}, {location.state}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{ fontSize: '13px', fontWeight: 500, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', color: scanning ? '#9CA3AF' : '#374151', padding: '8px 16px', cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 150ms' }}
            onMouseEnter={(e) => { if (!scanning) { (e.currentTarget as HTMLElement).style.borderColor = '#374151'; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; }}
          >
            {scanning ? 'Scanning...' : 'Scan Now'}
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            style={{ fontSize: '13px', fontWeight: 600, background: syncingAll ? '#93C5FD' : '#2563EB', border: 'none', borderRadius: '8px', color: '#FFFFFF', padding: '8px 16px', cursor: syncingAll ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 150ms' }}
            onMouseEnter={(e) => { if (!syncingAll) (e.currentTarget as HTMLElement).style.background = '#1D4ED8'; }}
            onMouseLeave={(e) => { if (!syncingAll) (e.currentTarget as HTMLElement).style.background = '#2563EB'; }}
          >
            {syncingAll ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Source of Truth */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280' }}>
              Source of Truth
            </h2>
            {!editingSOT ? (
              <button onClick={startEdit} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: 0, transition: 'opacity 150ms' }}>
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: 0 }}>
                  Cancel
                </button>
                <button
                  onClick={handleSaveSOT}
                  disabled={saving}
                  style={{ background: 'none', border: 'none', color: saving ? '#9CA3AF' : '#16A34A', fontSize: '13px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", padding: 0 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {editingSOT && sotForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(['name', 'phone', 'address', 'website'] as const).map((field) => (
                <div key={field}>
                  <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '5px' }}>{field}</div>
                  <input
                    style={inputStyle}
                    value={sotForm[field]}
                    onChange={(e) => setSotForm({ ...sotForm, [field]: e.target.value })}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '6px' }}>Hours</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {DAYS.map((day) => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, width: '30px', flexShrink: 0 }}>{day.slice(0, 3)}</span>
                      <input
                        style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px' }}
                        value={sotForm.hours[day] ?? ''}
                        onChange={(e) => setSotForm({ ...sotForm, hours: { ...sotForm.hours, [day]: e.target.value } })}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SOTField label="Name" value={String(sot.name ?? '')} />
              <SOTField label="Phone" value={String(sot.phone ?? '')} />
              <SOTField label="Address" value={String(sot.address ?? '')} />
              <SOTField label="Website" value={String(sot.website ?? '—')} />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '6px' }}>Hours</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {DAYS.map((day) => hours[day] !== undefined && (
                    <div key={day} style={{ fontSize: '13px', display: 'flex', gap: '10px' }}>
                      <span style={{ color: '#9CA3AF', width: '30px', flexShrink: 0, fontWeight: 500 }}>{day.slice(0, 3)}</span>
                      <span style={{ color: hours[day] === 'Closed' ? '#9CA3AF' : '#374151' }}>{hours[day]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Platform Listings */}
        <div>
          <h2 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '16px' }}>
            Platform Listings
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {location.listings.map((listing) => {
              const data = listing.data as Record<string, unknown>;
              const st = STATUS_STYLES[listing.status] ?? STATUS_STYLES.pending;
              const isSyncing = syncing === listing.platform;
              const isDrifted = (f: string) => listing.driftFields.includes(f);

              const PLATFORM_ACCENTS: Record<string, string> = {
                google: '#4285F4', yelp: '#FF1A1A', apple_maps: '#555555',
                bing: '#008373', facebook: '#1877F2',
              };
              const PLATFORM_NAMES: Record<string, string> = {
                google: 'Google Business Profile', yelp: 'Yelp',
                apple_maps: 'Apple Maps', bing: 'Bing Places', facebook: 'Facebook',
              };
              const PLATFORM_ICONS: Record<string, { bg: string; color: string; letter: string }> = {
                google:     { bg: '#FFFFFF', color: '#4285F4', letter: 'G' },
                yelp:       { bg: '#FF1A1A', color: '#FFFFFF', letter: 'y' },
                apple_maps: { bg: '#000000', color: '#FFFFFF', letter: '⌘' },
                bing:       { bg: '#008373', color: '#FFFFFF', letter: 'b' },
                facebook:   { bg: '#1877F2', color: '#FFFFFF', letter: 'f' },
              };

              const accent = PLATFORM_ACCENTS[listing.platform] ?? '#6B7280';
              const pIcon = PLATFORM_ICONS[listing.platform];
              const starCount = listing.status === 'synced' ? 5 : listing.status === 'drifted' ? 4 : 3;
              const starColor = listing.platform === 'yelp' ? '#FF1A1A' : '#FBBF24';

              const fieldStyle = (field: string) => ({
                color: isDrifted(field) ? '#D97706' : '#374151',
                background: isDrifted(field) ? '#FFFBEB' : 'transparent',
                borderRadius: isDrifted(field) ? '3px' : '0',
                padding: isDrifted(field) ? '0 3px' : '0',
              });

              return (
                <div
                  key={listing.id}
                  style={{ border: '1px solid #E5E7EB', borderTop: `3px solid ${accent}`, borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Platform header */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {pIcon ? (
                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: pIcon.bg, border: pIcon.bg === '#FFFFFF' ? '1px solid #E5E7EB' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: pIcon.color, flexShrink: 0 }}>
                          {pIcon.letter}
                        </div>
                      ) : (
                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff' }}>
                          {listing.platform[0].toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {PLATFORM_NAMES[listing.platform] ?? listing.platform}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: '20px', padding: '2px 8px' }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '12px 14px', flex: 1 }}>
                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                      <span style={{ color: starColor, fontSize: '13px', letterSpacing: '1px' }}>
                        {'★'.repeat(starCount)}{'☆'.repeat(5 - starCount)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>· synced {timeAgo(listing.lastSyncedAt)}</span>
                    </div>

                    {/* Business name */}
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', ...fieldStyle('name') }}>
                      {String(data.name ?? '')}
                    </div>

                    {/* Address */}
                    <div style={{ display: 'flex', gap: '4px', fontSize: '12px', marginBottom: '3px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#9CA3AF', flexShrink: 0 }}>📍</span>
                      <span style={{ ...fieldStyle('address'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(data.address ?? '')}</span>
                    </div>

                    {/* Phone */}
                    <div style={{ display: 'flex', gap: '4px', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: '#9CA3AF' }}>📞</span>
                      <span style={fieldStyle('phone')}>{String(data.phone ?? '')}</span>
                    </div>

                    {/* Drift tags */}
                    {listing.driftFields.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                        {listing.driftFields.includes('hours') && (
                          <span style={{ fontSize: '11px', color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '4px', padding: '2px 7px', fontWeight: 500 }}>
                            ⚠ hours differ
                          </span>
                        )}
                        {listing.driftFields.filter(f => f !== 'hours').map(f => (
                          <span key={f} style={{ fontSize: '11px', color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '4px', padding: '2px 7px', fontWeight: 500 }}>
                            {f} drifted
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {listing.driftFields.length > 0 ? `${listing.driftFields.length} field${listing.driftFields.length !== 1 ? 's' : ''} out of sync` : 'All fields synced'}
                    </span>
                    <button
                      onClick={() => handleSync(listing.platform)}
                      disabled={isSyncing}
                      style={{ background: listing.driftFields.length > 0 ? '#2563EB' : '#E5E7EB', color: listing.driftFields.length > 0 ? '#FFFFFF' : '#6B7280', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 500, cursor: isSyncing ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 150ms', opacity: isSyncing ? 0.5 : 1 }}
                      onMouseEnter={(e) => { if (!isSyncing && listing.driftFields.length > 0) (e.currentTarget as HTMLElement).style.background = '#1D4ED8'; }}
                      onMouseLeave={(e) => { if (!isSyncing) (e.currentTarget as HTMLElement).style.background = listing.driftFields.length > 0 ? '#2563EB' : '#E5E7EB'; }}
                    >
                      {isSyncing ? 'Syncing...' : 'Sync'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
