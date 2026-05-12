'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/useApp';

export default function AdminPage() {
  const { t, theme, lang } = useApp();
  const [m, setM] = useState({ vaultUSDC: 0, activePlayers: 0, txLastHour: 0,
    errors24h: 0, feeWallet: 0, devWallet: 0, refPool: 0 });
  useEffect(() => {
    const tick = () => fetch('/api/admin').then(r => r.json()).then(setM).catch(() => {});
    tick(); const i = setInterval(tick, 5000);
    return () => clearInterval(i);
  }, []);
  return (
    <main data-theme={theme} data-lang={lang}>
      <h1>{t('nav_admin')} Dashboard</h1>
      <div className="grid">
        {Object.entries(m).map(([k,v]) => (
          <div key={k} className="card"><div className="k">{k}</div><div className="v">{v}</div></div>
        ))}
      </div>
    </main>
  );
}
