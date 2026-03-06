function getColor(score: number): string {
  if (score >= 90) return '#16A34A';
  if (score >= 70) return '#D97706';
  return '#DC2626';
}

export default function HealthScoreBadge({ score }: { score: number }) {
  const color = getColor(score);
  const pct = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flex: 1, height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            minWidth: pct === 0 ? '2px' : undefined,
            height: '100%',
            background: color,
            borderRadius: '3px',
            transition: 'width 300ms ease',
          }}
        />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 500, color, minWidth: '32px', textAlign: 'right', flexShrink: 0 }}>
        {pct}%
      </span>
    </div>
  );
}
