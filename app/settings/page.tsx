'use client';
import { useApp } from '@/lib/useApp';

export default function SettingsPage() {
  const { t, lang, setLang, theme, setTheme } = useApp();
  return (
    <main data-theme={theme}>
      <h1>{t('settings_title')}</h1>
      <section>
        <label>{t('language')}</label>
        <div className="seg">
          <button data-on={lang==='en'} onClick={() => setLang('en')}>EN</button>
          <button data-on={lang==='id'} onClick={() => setLang('id')}>ID</button>
        </div>
      </section>
      <section>
        <label>{t('theme')}</label>
        <div className="seg">
          <button data-on={theme==='dark'} onClick={() => setTheme('dark')}>{t('dark')}</button>
          <button data-on={theme==='light'} onClick={() => setTheme('light')}>{t('light')}</button>
        </div>
      </section>
    </main>
  );
}
