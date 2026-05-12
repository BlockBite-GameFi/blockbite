'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useApp, type Lang, type Theme } from '@/lib/useApp';
import { ArrowLeft, Volume2, Music, Zap, Bell, Globe, Palette, Server, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { lang, setLang, theme, setTheme, t, palette: p } = useApp();
  const [sound, setSound] = useState(true);
  const [music, setMusic] = useState(true);
  const [motion, setMotion] = useState(false);
  const [notif, setNotif] = useState(false);
  const [rpc, setRpc] = useState('https://api.mainnet-beta.solana.com');

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ds-bg)', color: 'var(--ds-text)', paddingTop: 64 }}>
      <Navbar />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--ds-surface)', border: '1px solid var(--ds-border)',
            color: 'var(--ds-text-dim)', textDecoration: 'none',
            transition: 'color 0.15s, border-color 0.15s',
          }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontFamily: 'var(--font-sg)', fontSize: 24, fontWeight: 700, margin: 0 }}>
              {t('settings_title')}
            </h1>
            <p style={{ fontFamily: 'var(--font-sg)', fontSize: 13, color: 'var(--ds-text-dim)', margin: 0, marginTop: 2 }}>
              Customize your BlockBite experience
            </p>
          </div>
        </div>

        {/* Section: Language */}
        <Section icon={<Globe size={16} />} title={t('language')}>
          <SegmentedControl
            options={[
              { value: 'en', label: 'English' },
              { value: 'id', label: 'Indonesia' },
            ]}
            value={lang}
            onChange={(v) => setLang(v as Lang)}
          />
        </Section>

        {/* Section: Theme */}
        <Section icon={<Palette size={16} />} title={t('theme')}>
          <SegmentedControl
            options={[
              { value: 'dark', label: '🌙 ' + t('dark') },
              { value: 'light', label: '☀️ ' + t('light') },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as Theme)}
          />
        </Section>

        {/* Section: Audio */}
        <Section icon={<Volume2 size={16} />} title="Audio">
          <ToggleRow label={t('sound')} value={sound} onChange={setSound} />
          <ToggleRow label={t('music')} value={music} onChange={setMusic} />
        </Section>

        {/* Section: Accessibility */}
        <Section icon={<Zap size={16} />} title="Accessibility">
          <ToggleRow label={t('motion')} value={motion} onChange={setMotion} />
          <ToggleRow label={t('notif')} value={notif} onChange={setNotif} />
        </Section>

        {/* Section: Network */}
        <Section icon={<Server size={16} />} title={t('rpc')}>
          <input
            value={rpc}
            onChange={e => setRpc(e.target.value)}
            placeholder="https://api.mainnet-beta.solana.com"
            style={{
              width: '100%', padding: '11px 14px',
              background: 'var(--ds-surface2)',
              border: '1px solid var(--ds-border)',
              borderRadius: 10, color: 'var(--ds-text)',
              fontFamily: 'var(--font-jb)', fontSize: 12,
              outline: 'none',
            }}
          />
        </Section>

        {/* Disconnect */}
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 0', marginTop: 8,
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12, cursor: 'pointer',
          color: 'var(--ds-danger)', fontFamily: 'var(--font-sg)',
          fontSize: 14, fontWeight: 600,
          transition: 'background 0.15s',
        }}>
          <LogOut size={15} />
          {t('disconnect')}
        </button>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-sg)', fontSize: 12, color: 'var(--ds-text-dim)', marginTop: 24, opacity: 0.5 }}>
          BlockBite v0.4.0 · Solana Devnet
        </p>
      </div>
    </main>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--ds-surface)',
      border: '1px solid var(--ds-border)',
      borderRadius: 16, padding: '20px 20px 8px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: 'var(--ds-accent)' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-sg)', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ds-text-dim)' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      background: 'var(--ds-surface2)',
      border: '1px solid var(--ds-border)',
      borderRadius: 12, marginBottom: 12,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: '9px 16px', borderRadius: 9,
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sg)', fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s ease',
            background: value === opt.value
              ? 'linear-gradient(135deg, var(--ds-accent), var(--ds-accent2))'
              : 'transparent',
            color: value === opt.value ? '#fff' : 'var(--ds-text-dim)',
            boxShadow: value === opt.value ? '0 2px 8px rgba(167,139,250,0.3)' : 'none',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 14, marginBottom: 2,
      borderBottom: '1px solid var(--ds-border)',
    }}>
      <span style={{ fontFamily: 'var(--font-sg)', fontSize: 14, color: 'var(--ds-text)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value
            ? 'linear-gradient(135deg, var(--ds-accent), var(--ds-accent2))'
            : 'var(--ds-surface2)',
          border: '1px solid ' + (value ? 'transparent' : 'var(--ds-border)'),
          cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s ease',
          boxShadow: value ? '0 0 10px rgba(167,139,250,0.4)' : 'none',
        }}
        aria-checked={value}
        role="switch"
      >
        <span style={{
          position: 'absolute', top: 3,
          left: value ? 22 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );
}
