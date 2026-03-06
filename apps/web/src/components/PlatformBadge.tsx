const PLATFORM_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  google:      { color: '#4285F4', border: 'rgba(66,133,244,0.3)',   bg: 'rgba(66,133,244,0.1)' },
  yelp:        { color: '#FF1A1A', border: 'rgba(255,26,26,0.3)',    bg: 'rgba(255,26,26,0.1)' },
  apple_maps:  { color: '#A0A0A0', border: 'rgba(160,160,160,0.3)', bg: 'rgba(160,160,160,0.1)' },
  bing:        { color: '#008373', border: 'rgba(0,131,115,0.3)',    bg: 'rgba(0,131,115,0.1)' },
  facebook:    { color: '#1877F2', border: 'rgba(24,119,242,0.3)',   bg: 'rgba(24,119,242,0.1)' },
  tripadvisor: { color: '#00AF87', border: 'rgba(0,175,135,0.3)',    bg: 'rgba(0,175,135,0.1)' },
  foursquare:  { color: '#F94877', border: 'rgba(249,72,119,0.3)',   bg: 'rgba(249,72,119,0.1)' },
};

const PLATFORM_LABELS: Record<string, string> = {
  google:      'Google',
  yelp:        'Yelp',
  apple_maps:  'Apple Maps',
  bing:        'Bing',
  facebook:    'Facebook',
  tripadvisor: 'TripAdvisor',
  foursquare:  'Foursquare',
};

export const PLATFORM_COLORS = PLATFORM_STYLES;

export default function PlatformBadge({ platform }: { platform: string }) {
  const style = PLATFORM_STYLES[platform] ?? {
    color: '#6B7280',
    border: 'rgba(107,114,128,0.3)',
    bg: 'rgba(107,114,128,0.08)',
  };
  const label = PLATFORM_LABELS[platform] ?? platform;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        color: style.color,
        border: `1px solid ${style.border}`,
        background: style.bg,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
