'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { Award, History, Shield, Edit2, Check, Copy, ExternalLink } from 'lucide-react';
import { CssAvatar, AvatarPicker, AVATAR_CONFIGS } from '@/components/CssAvatars';
import { explorerAddr } from '@/lib/solana/config';
import styles from './profile.module.css';

const GameBackground = dynamic(() => import('@/components/GameBackground'), { ssr: false });

export default function ProfilePage() {
  const { publicKey, wallet } = useWallet();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [copied, setCopied] = useState(false);
  const [referredWallets, setReferredWallets] = useState<string[]>([]);
  const [refCopied, setRefCopied] = useState(false);
  const [maxLevel, setMaxLevel] = useState(1);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    const u = localStorage.getItem('bb_username') || '';
    const a = parseInt(localStorage.getItem('bb_avatar') || '0');
    setUsername(u);
    setEditValue(u);
    setSelectedAvatar(a);
    // Real stats from localStorage
    const lvl = parseInt(localStorage.getItem('bb_max_level') || '1');
    setMaxLevel(isNaN(lvl) ? 1 : lvl);
    const gp = parseInt(localStorage.getItem('bb_games_played') || '0');
    setGamesPlayed(isNaN(gp) ? 0 : gp);
    // Real referrals
    try {
      const refs = JSON.parse(localStorage.getItem('bb_referrals') || '[]');
      setReferredWallets(Array.isArray(refs) ? refs : []);
    } catch { setReferredWallets([]); }
  }, []);

  const handleSave = () => {
    const trimmed = editValue.trim();
    setUsername(trimmed);
    localStorage.setItem('bb_username', trimmed);
    window.dispatchEvent(new Event('storage'));
    setIsEditing(false);
  };

  const handleAvatarSelect = (idx: number) => {
    setSelectedAvatar(idx);
    localStorage.setItem('bb_avatar', idx.toString());
    window.dispatchEvent(new Event('storage'));
  };

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const walletAddr = publicKey?.toBase58() ?? '';
  const displayAddr = walletAddr
    ? `${walletAddr.slice(0, 6)}...${walletAddr.slice(-6)}`
    : 'Not Connected';

  const avatarCfg = AVATAR_CONFIGS[selectedAvatar] ?? AVATAR_CONFIGS[0];

  return (
    <main className={styles.main} style={{ background: 'var(--ds-bg)', color: 'var(--ds-text)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 120, paddingBottom: 100 }}>

        {/* ── Profile Header ── */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarGlow} style={{ background: `radial-gradient(circle, ${avatarCfg.glowColor}40 0%, transparent 70%)` }} />
            <CssAvatar config={avatarCfg} size={96} selected />
            {wallet?.adapter.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                className={styles.walletBadgeIcon}
              />
            )}
          </div>

          <div className={styles.info}>
            <div className={styles.usernameRow}>
              {isEditing ? (
                <div className={styles.editInputWrap}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className={styles.usernameInput}
                    placeholder="Enter username..."
                    maxLength={24}
                    autoFocus
                  />
                  <button type="button" onClick={handleSave} className={styles.saveBtn}>
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="orbitron neon-cyan">{username || 'Anonymous Player'}</h1>
                  <button type="button" onClick={() => setIsEditing(true)} className={styles.editBtn} title="Edit username">
                    <Edit2 size={16} />
                  </button>
                </>
              )}
            </div>

            <div className={styles.walletAddrRow}>
              <span className={styles.walletAddr}>{displayAddr}</span>
              {walletAddr && (
                <>
                  <button type="button" className={styles.iconBtn} onClick={handleCopy} title="Copy address">
                    <Copy size={13} color={copied ? '#00FF88' : '#55557A'} />
                  </button>
                  <a
                    href={explorerAddr(walletAddr)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.iconBtn}
                    title="View on Solana Explorer"
                  >
                    <ExternalLink size={13} color="#55557A" />
                  </a>
                </>
              )}
            </div>

            <div className={styles.badges}>
              <span className="badge badge-cyan">PLAYER</span>
              <span className="badge badge-gold">BETA TESTER</span>
              <span className="badge" style={{ background: `${avatarCfg.glowColor}22`, color: avatarCfg.glowColor, border: `1px solid ${avatarCfg.glowColor}55` }}>
                {avatarCfg.name}
              </span>
            </div>
          </div>
        </div>

        {/* ── Avatar Selection ── */}
        <section className="glass-panel" style={{ padding: 32, marginBottom: 32 }}>
          <h3 className="orbitron neon-cyan" style={{ marginBottom: 8, fontSize: 16 }}>CHOOSE YOUR AVATAR</h3>
          <p style={{ color: '#55557A', fontSize: 12, marginBottom: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            12 unique CSS-generated avatars — each with its own visual identity.
          </p>
          <AvatarPicker selected={selectedAvatar} onSelect={handleAvatarSelect} size={54} />
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#55557A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Selected: <span style={{ color: avatarCfg.glowColor, fontWeight: 700 }}>{avatarCfg.name}</span>
          </p>
        </section>

        {/* ── Stats ── */}
        <div className={styles.statsGrid}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className={styles.statLabel}><Award size={15} /> TOTAL EARNINGS</div>
            <div className={styles.statValue}>0.00 <span style={{ fontSize: 13, color: '#8888BB' }}>USDC</span></div>
            <div style={{ fontSize: 11, color: '#444466', marginTop: 4 }}>Phase 0 · Devnet</div>
          </div>
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className={styles.statLabel}><History size={15} /> GAMES PLAYED</div>
            <div className={styles.statValue}>{gamesPlayed}</div>
          </div>
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className={styles.statLabel}><Shield size={15} /> MAX LEVEL</div>
            <div className={styles.statValue}>{maxLevel}</div>
          </div>
        </div>

        {/* ── Settings + Referral ── */}
        <div className={styles.contentSections}>
          <section className="glass-panel" style={{ padding: 32 }}>
            <h3 className="orbitron neon-magenta" style={{ marginBottom: 24, fontSize: 16 }}>ACCOUNT SETTINGS</h3>
            {[
              { label: 'Two-Factor Authentication', desc: 'Secure your account with 2FA.' },
              { label: 'Email Notifications',       desc: 'Get notified when you win rewards.' },
              { label: 'Rank Change Alerts',        desc: 'Browser push when your rank shifts.' },
            ].map(({ label, desc }) => (
              <div key={label} className={styles.settingItem}>
                <div>
                  <p style={{ fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: 12, color: '#8888BB' }}>{desc}</p>
                </div>
                <span className="badge badge-cyan">SOON</span>
              </div>
            ))}
          </section>

          <section className="glass-panel" style={{ padding: 32 }}>
            <h3 className="orbitron neon-green" style={{ marginBottom: 8, fontSize: 16 }}>REFERRAL PROGRAM</h3>
            <p style={{ fontSize: 14, color: '#8888BB', marginBottom: 16 }}>
              Earn <strong style={{ color: '#00FF88' }}>5% lifetime</strong> from every ticket your referrals buy.
            </p>

            {/* Referral link */}
            <div className={styles.referralLinkWrap}>
              <input
                type="text"
                readOnly
                value={walletAddr ? `https://blockbite.vercel.app/r/${walletAddr.slice(0, 8)}` : 'Connect wallet to get your link'}
                className={styles.referralInput}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (walletAddr) {
                    navigator.clipboard.writeText(`https://blockbite.vercel.app/r/${walletAddr.slice(0, 8)}`);
                    setRefCopied(true);
                    setTimeout(() => setRefCopied(false), 2000);
                  }
                }}
              >
                {refCopied ? '✓ COPIED' : 'COPY'}
              </button>
            </div>

            {/* Real referred wallets */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: '#55557A', fontFamily: "'Orbitron', monospace", letterSpacing: '0.1em', marginBottom: 12 }}>
                TOTAL REFERRALS: <span style={{ color: '#00FF88' }}>{referredWallets.length}</span>
              </div>
              {referredWallets.length === 0 ? (
                <p style={{ fontSize: 13, color: '#444466', fontStyle: 'italic' }}>
                  No referrals yet — share your link to start earning.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#55557A', marginBottom: 4 }}>REGISTERED WALLETS:</div>
                  {referredWallets.map((wallet, i) => (
                    <div key={wallet} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)',
                      borderRadius: 8, padding: '8px 12px',
                    }}>
                      <span style={{ color: '#00FF88', fontFamily: "'Orbitron', monospace", fontSize: 11 }}>{i + 1}.</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#CCCCCC', letterSpacing: '0.05em' }}>
                        {wallet.length > 20 ? `${wallet.slice(0, 6)}...${wallet.slice(-6)}` : wallet}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </main>
  );
}
