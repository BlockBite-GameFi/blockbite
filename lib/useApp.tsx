'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'en' | 'id';
export type Theme = 'dark' | 'light';

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    nav_home: 'Home', nav_play: 'Play', nav_map: 'Map',
    nav_shop: 'Shop', nav_leader: 'Leaderboard', nav_profile: 'Profile',
    nav_admin: 'Admin', nav_history: 'History', nav_claim: 'Claim',
    settings_title: 'Settings', language: 'Language', theme: 'Theme',
    dark: 'Dark', light: 'Light',
    sound: 'Sound Effects', music: 'Background Music',
    motion: 'Reduce Motion', notif: 'Notifications',
    rpc: 'RPC ENDPOINT', disconnect: 'Disconnect Wallet',
    connect: 'Connect Wallet',
    tickets: 'Tickets', level: 'Level', claimed: 'Claimed', vault: 'Vault',
    no_data: 'No data', backend_off: 'Backend offline',
    empty_lb: 'No entries yet. Connect wallet to appear.',
    empty_hist: 'No history yet.',
    nav_quests: 'Quests', nav_season: 'Season Pass',
    nav_friends: 'Friends', nav_daily: 'Daily Login',
    join_waitlist: 'Join Waitlist',
    waitlist_note: 'No spam. Unsubscribe anytime.',
    waitlist_success: "You're on the list! We'll notify you when BlockBite launches.",
  },
  id: {
    nav_home: 'Beranda', nav_play: 'Main', nav_map: 'Peta',
    nav_shop: 'Toko', nav_leader: 'Papan Skor', nav_profile: 'Profil',
    nav_admin: 'Admin', nav_history: 'Riwayat', nav_claim: 'Klaim',
    settings_title: 'Pengaturan', language: 'Bahasa', theme: 'Tema',
    dark: 'Gelap', light: 'Terang',
    sound: 'Efek Suara', music: 'Musik Latar',
    motion: 'Kurangi Animasi', notif: 'Notifikasi',
    rpc: 'ENDPOINT RPC', disconnect: 'Putuskan Wallet',
    connect: 'Hubungkan Wallet',
    tickets: 'Tiket', level: 'Level', claimed: 'Diklaim', vault: 'Vault',
    no_data: 'Tidak ada data', backend_off: 'Backend offline',
    empty_lb: 'Belum ada data. Hubungkan wallet.',
    empty_hist: 'Belum ada riwayat.',
    nav_quests: 'Misi', nav_season: 'Pass Musim',
    nav_friends: 'Teman', nav_daily: 'Login Harian',
    join_waitlist: 'Daftar Waitlist',
    waitlist_note: 'Tanpa spam. Bisa berhenti kapan saja.',
    waitlist_success: 'Kamu sudah terdaftar! Kami akan notifikasi saat BlockBite meluncur.',
  },
};

export type Palette = {
  bg: string; surface: string; surface2: string;
  text: string; textDim: string; border: string;
  accent: string; accent2: string;
  warn: string; danger: string; ok: string;
  headerGrad: string;
};

export const PALETTES: Record<Theme, Palette> = {
  dark: {
    bg: '#08081a', surface: 'rgba(255,255,255,0.04)', surface2: 'rgba(0,0,0,0.35)',
    text: '#fff', textDim: '#94a3b8', border: '#1f1f3a',
    accent: '#a78bfa', accent2: '#5eead4',
    warn: '#fbbf24', danger: '#ef4444', ok: '#22c55e',
    headerGrad: 'linear-gradient(180deg,#1e1b4b 0%,#08081a 100%)',
  },
  light: {
    bg: '#f7f7fb', surface: 'rgba(0,0,0,0.04)', surface2: 'rgba(255,255,255,0.8)',
    text: '#0a0a14', textDim: '#475569', border: '#e2e8f0',
    accent: '#6d28d9', accent2: '#0d9488',
    warn: '#b45309', danger: '#b91c1c', ok: '#15803d',
    headerGrad: 'linear-gradient(180deg,#ede9fe 0%,#f7f7fb 100%)',
  },
};

type AppCtx = {
  lang: Lang; setLang: (l: Lang) => void;
  theme: Theme; setTheme: (t: Theme) => void;
  t: (k: string) => string;
  palette: Palette;
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const l = localStorage.getItem('bb:lang') as Lang | null;
    const th = localStorage.getItem('bb:theme') as Theme | null;
    if (l === 'en' || l === 'id') setLangState(l);
    // Apply saved theme immediately to avoid FOUC; default dark
    const resolvedTheme = (th === 'dark' || th === 'light') ? th : 'dark';
    if (resolvedTheme !== 'dark') setThemeState(resolvedTheme);
    document.documentElement.dataset.theme = resolvedTheme;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('bb:lang', lang);
  }, [lang, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('bb:theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme, mounted]);

  const setLang = (l: Lang) => setLangState(l);
  const setTheme = (th: Theme) => setThemeState(th);

  return (
    <Ctx.Provider value={{
      lang, setLang, theme, setTheme,
      t: (k) => DICT[lang][k] ?? k,
      palette: PALETTES[theme],
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
};
