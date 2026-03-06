import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import PlatformBadge, { PLATFORM_COLORS } from './PlatformBadge';

export interface AlertWithLocation {
  id: string;
  field: string;
  platform: string;
  expected: string;
  actual: string;
  severity: string;
  status: string;
  locationId: string;
  listingId: string;
  location?: { name: string; city: string; state: string };
}

function formatHoursValue(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed as Record<string, string>);
    if (entries.length === 0) return null;
    const DAY_ABBR: Record<string, string> = {
      Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
      Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
    };
    return entries.map(([day, hours]) => `${DAY_ABBR[day] ?? day.slice(0, 3)}: ${hours}`).join(', ');
  } catch {
    return null;
  }
}

function formatValue(raw: string): { display: string; full: string } {
  const hours = formatHoursValue(raw);
  const full = hours !== null ? hours : raw;
  const display = full.length > 45 ? full.slice(0, 45) + '…' : full;
  return { display, full };
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#9CA3AF' }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

export default function AlertFeed({
  alerts,
  onResolve,
}: {
  alerts: AlertWithLocation[];
  onResolve?: (id: string) => Promise<void>;
}) {
  const [fading, setFading] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ id: string; action: 'resolve' | 'sync' } | null>(null);

  async function doFadeAndRefresh(alert: AlertWithLocation) {
    setConfirming(null);
    setFading((prev) => new Set(prev).add(alert.id));
    window.dispatchEvent(new CustomEvent('localsync:alertResolved'));
    await new Promise((r) => setTimeout(r, 380));
    await onResolve?.(alert.id);
  }

  async function handleMarkResolved(alert: AlertWithLocation) {
    setBusy({ id: alert.id, action: 'resolve' });
    try {
      await api.patch(`/api/alerts/${alert.id}/resolve`);
      await doFadeAndRefresh(alert);
    } finally {
      setBusy(null);
    }
  }

  async function handleFixAndSync(alert: AlertWithLocation) {
    setBusy({ id: alert.id, action: 'sync' });
    try {
      await api.post(`/api/locations/${alert.locationId}/sync/${alert.platform}`);
      await api.patch(`/api/alerts/${alert.id}/resolve`);
      await doFadeAndRefresh(alert);
    } finally {
      setBusy(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: '14px' }}>
        No alerts
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {alerts.map((alert) => {
        const platformStyle = PLATFORM_COLORS[alert.platform] ?? { color: '#6B7280', border: 'rgba(107,114,128,0.3)', bg: 'rgba(107,114,128,0.08)' };
        const expectedFmt = formatValue(alert.expected);
        const actualFmt = formatValue(alert.actual);
        const isFading = fading.has(alert.id);
        const isConfirming = confirming === alert.id;
        const isBusy = busy?.id === alert.id;

        return (
          <div
            key={alert.id}
            className={isFading ? 'alert-fade-out' : undefined}
            style={{
              borderLeft: `3px solid ${platformStyle.color}`,
              borderTop: '1px solid #E5E7EB',
              borderRight: '1px solid #E5E7EB',
              borderBottom: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            {/* Main row */}
            <div
              style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, transition: 'background 150ms' }}
              onMouseEnter={(e) => { if (!isConfirming) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; }}
            >
              {/* Location pin + name link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, maxWidth: '130px', minWidth: 0, overflow: 'hidden' }}>
                <PinIcon />
                <Link
                  to={`/locations/${alert.locationId}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: '#111827', fontSize: '13px', fontWeight: 500, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#2563EB'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#111827'; }}
                >
                  {alert.location?.name ?? alert.locationId}
                </Link>
              </div>

              {/* Platform badge */}
              <div style={{ flexShrink: 0 }}>
                <PlatformBadge platform={alert.platform} />
              </div>

              {/* Field badge */}
              <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 500, color: '#2563EB', background: '#EFF6FF', padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                {alert.field}
              </span>

              {/* Value diff (truncated, ellipsis) */}
              <div
                style={{ flex: 1, minWidth: 0, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={`${expectedFmt.full} → ${actualFmt.full}`}
              >
                <span style={{ color: '#374151' }}>{expectedFmt.display}</span>
                <span style={{ color: '#D1D5DB', margin: '0 5px' }}>→</span>
                <span style={{ color: '#D97706' }}>{actualFmt.display}</span>
              </div>

              {/* Action */}
              {alert.status === 'open' && onResolve && (
                <button
                  onClick={() => setConfirming(isConfirming ? null : alert.id)}
                  disabled={isBusy}
                  style={{ flexShrink: 0, background: isConfirming ? '#FEF2F2' : 'none', border: `1px solid ${isConfirming ? '#FECACA' : '#E5E7EB'}`, borderRadius: '6px', color: isConfirming ? '#DC2626' : '#6B7280', cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter', sans-serif", fontWeight: 500, padding: '4px 10px', transition: 'all 150ms', whiteSpace: 'nowrap' }}
                >
                  {isConfirming ? 'Cancel' : 'Resolve'}
                </button>
              )}
              {alert.status === 'resolved' && (
                <span style={{ flexShrink: 0, color: '#16A34A', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>✓ Resolved</span>
              )}
            </div>

            {/* Confirmation panel */}
            {isConfirming && (
              <div className="alert-panel" style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB', padding: '14px 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>
                  Resolve this alert?
                </div>

                {/* Full values */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', wordBreak: 'break-word' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ color: '#9CA3AF', flexShrink: 0, width: '56px' }}>Expected</span>
                    <span style={{ color: '#374151' }}>{expectedFmt.full}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#9CA3AF', flexShrink: 0, width: '56px' }}>Actual</span>
                    <span style={{ color: '#D97706' }}>{actualFmt.full}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleMarkResolved(alert)}
                    disabled={isBusy}
                    style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', fontWeight: 500, cursor: isBusy ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: isBusy ? 0.7 : 1, display: 'flex', alignItems: 'center' }}
                  >
                    {isBusy && busy?.action === 'resolve' && <Spinner />}
                    Mark resolved
                  </button>
                  <button
                    onClick={() => handleFixAndSync(alert)}
                    disabled={isBusy}
                    style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '13px', fontWeight: 500, cursor: isBusy ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: isBusy ? 0.7 : 1, display: 'flex', alignItems: 'center' }}
                  >
                    {isBusy && busy?.action === 'sync' && <Spinner />}
                    Fix &amp; sync
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    disabled={isBusy}
                    style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: '7px 4px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
