import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const inputStyle = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  color: '#111827',
  fontSize: '14px',
  fontFamily: "'Inter', sans-serif",
  padding: '9px 12px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 150ms',
};

const labelStyle = {
  display: 'block' as const,
  fontSize: '12px',
  fontWeight: 500 as const,
  color: '#374151',
  marginBottom: '5px',
};

export default function AddLocationModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !state.trim()) {
      setError('Name, city, and state are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/api/locations', {
        name: name.trim(),
        city: city.trim(),
        state: state.trim(),
        sourceOfTruth: {
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          website: website.trim(),
        },
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: '#FFFFFF', borderRadius: '14px',
        padding: '28px', width: '440px', maxWidth: 'calc(100vw - 32px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Add Location</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '20px', lineHeight: 1, padding: '2px 6px', borderRadius: '6px', fontFamily: 'inherit' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BrightSmile Chicago North"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px' }}>
            <div>
              <label style={labelStyle}>City *</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Chicago"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
              />
            </div>
            <div>
              <label style={labelStyle}>State *</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="IL"
                maxLength={2}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 312-555-0100"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://brightsmile.com"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
            />
          </div>

          {error && (
            <div style={{ color: '#DC2626', fontSize: '13px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#374151', fontSize: '14px', fontWeight: 500, padding: '8px 18px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 150ms' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#9CA3AF'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{ background: busy ? '#93C5FD' : '#2563EB', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', fontWeight: 500, padding: '8px 18px', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms' }}
            >
              {busy ? 'Creating…' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
