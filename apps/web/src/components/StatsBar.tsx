import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Stat {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  href?: string;
  addButton?: boolean;
}

const STAT_ICONS = [
  <svg key="pin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  <svg key="heart" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  <svg key="bell" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  <svg key="check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
];

function StatCard({ s, i, onAddClick }: { s: Stat; i: number; onAddClick?: () => void }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isDriftedSub = s.sub && !s.sub.startsWith('0 ');
  const isClickable = !!s.href;

  function handleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    if (s.href) navigate(s.href);
  }

  return (
    <div
      key={s.label}
      className={`fade-in-up fade-in-up-${i}`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: hovered && isClickable ? '1px solid #2563EB' : '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '20px',
        opacity: 0,
        position: 'relative',
        cursor: isClickable ? 'pointer' : 'default',
        boxShadow: hovered && isClickable ? '0 4px 12px rgba(37,99,235,0.1)' : 'none',
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
    >
      {/* Icon top-right */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {s.addButton && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick?.(); }}
            title="Add location"
            style={{
              width: '22px', height: '22px', borderRadius: '6px',
              background: hovered ? '#EFF6FF' : '#F3F4F6',
              border: hovered ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
              color: hovered ? '#2563EB' : '#6B7280',
              cursor: 'pointer', fontSize: '16px', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 150ms',
              padding: 0,
            }}
          >
            +
          </button>
        )}
        {STAT_ICONS[i % STAT_ICONS.length]}
      </div>

      <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '10px' }}>
        {s.label}
      </div>
      <div style={{ fontSize: '30px', fontWeight: 700, color: s.color ?? '#111827', lineHeight: 1, marginBottom: '10px' }}>
        {s.value}
      </div>
      {s.sub && (
        <span style={{
          display: 'inline-block', fontSize: '11px', fontWeight: 500,
          color: isDriftedSub ? '#D97706' : '#16A34A',
          background: isDriftedSub ? '#FFFBEB' : '#F0FDF4',
          border: `1px solid ${isDriftedSub ? '#FDE68A' : '#BBF7D0'}`,
          borderRadius: '20px', padding: '2px 8px',
        }}>
          {s.sub}
        </span>
      )}

      {/* Arrow hint bottom-right on hover */}
      {isClickable && (
        <div style={{
          position: 'absolute', bottom: '14px', right: '16px',
          fontSize: '14px', color: '#2563EB',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 150ms',
        }}>
          →
        </div>
      )}
    </div>
  );
}

export default function StatsBar({
  stats,
  onAddLocation,
}: {
  stats: Stat[];
  onAddLocation?: () => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {stats.map((s, i) => (
        <StatCard key={s.label} s={s} i={i} onAddClick={s.addButton ? onAddLocation : undefined} />
      ))}
    </div>
  );
}
