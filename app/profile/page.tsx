'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { Settings, Shield, Award, History, Edit2, Check } from 'lucide-react';
import styles from './profile.module.css';

const GameBackground = dynamic(() => import('@/components/GameBackground'), { ssr: false });

  const [selectedAvatar, setSelectedAvatar] = useState(0);

  useEffect(() => {
    const storedAvatar = localStorage.getItem('bb_avatar');
    if (storedAvatar) setSelectedAvatar(parseInt(storedAvatar));
  }, []);

  const handleAvatarSelect = (idx: number) => {
    setSelectedAvatar(idx);
    localStorage.setItem('bb_avatar', idx.toString());
  };

  const walletAddr = publicKey?.toBase58() || '0x0000...0000';

  // Avatar slicing logic (assuming all.png is a grid)
  const getAvatarStyle = (idx: number) => ({
    backgroundImage: 'url("/assets/avatars/all.png")',
    backgroundSize: '300% 300%',
    backgroundPosition: `${(idx % 3) * 50}% ${Math.floor(idx / 3) * 50}%`,
  });

  return (
    <main className={styles.main}>
      <Navbar />
      <GameBackground />
      <div className="grid-overlay"></div>

      <div className="container" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarGlow} />
            <div className={styles.avatar} style={getAvatarStyle(selectedAvatar)}>
              {!selectedAvatar && (savedUsername || walletAddr).slice(0, 1).toUpperCase()}
            </div>
          </div>
          
          <div className={styles.info}>
            <div className={styles.usernameRow}>
              {isEditing ? (
                <div className={styles.editInputWrap}>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.usernameInput}
                    placeholder="Enter username..."
                  />
                  <button onClick={handleSave} className={styles.saveBtn}><Check size={18} /></button>
                </div>
              ) : (
                <>
                  <h1 className="orbitron neon-cyan">{savedUsername || 'Anonymous Player'}</h1>
                  <button onClick={() => setIsEditing(true)} className={styles.editBtn}><Edit2 size={16} /></button>
                </>
              )}
            </div>
            <p className={styles.walletAddr}>{walletAddr}</p>
            <div className={styles.badges}>
              <span className="badge badge-cyan">PLAYER</span>
              <span className="badge badge-gold">BETA TESTER</span>
            </div>
          </div>
        </div>

        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h3 className="orbitron neon-cyan" style={{ marginBottom: '24px', fontSize: '18px' }}>SELECT AVATAR</h3>
          <div className={styles.avatarGrid}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <div 
                key={idx}
                className={`${styles.avatarOption} ${selectedAvatar === idx ? styles.active : ''}`}
                style={getAvatarStyle(idx)}
                onClick={() => handleAvatarSelect(idx)}
              />
            ))}
          </div>
        </section>

        <div className={styles.statsGrid}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className={styles.statLabel}><Award size={16} /> TOTAL EARNINGS</div>
            <div className={styles.statValue}>0.00 <span style={{ fontSize: '14px', color: '#8888BB' }}>USDC</span></div>
          </div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className={styles.statLabel}><History size={16} /> GAMES PLAYED</div>
            <div className={styles.statValue}>0</div>
          </div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className={styles.statLabel}><Shield size={16} /> BEST SCORE</div>
            <div className={styles.statValue}>0</div>
          </div>
        </div>

        <div className={styles.contentSections}>
          <section className="glass-panel" style={{ padding: '32px' }}>
            <h3 className="orbitron neon-magenta" style={{ marginBottom: '24px', fontSize: '18px' }}>ACCOUNT SETTINGS</h3>
            <div className={styles.settingItem}>
              <div>
                <p style={{ fontWeight: '600' }}>Two-Factor Authentication</p>
                <p style={{ fontSize: '12px', color: '#8888BB' }}>Secure your account with 2FA.</p>
              </div>
              <span className="badge badge-cyan">COMING SOON</span>
            </div>
            <div className={styles.settingItem}>
              <div>
                <p style={{ fontWeight: '600' }}>Email Notifications</p>
                <p style={{ fontSize: '12px', color: '#8888BB' }}>Get notified when you win rewards.</p>
              </div>
              <span className="badge badge-cyan">COMING SOON</span>
            </div>
          </section>

          <section className="glass-panel" style={{ padding: '32px' }}>
            <h3 className="orbitron neon-green" style={{ marginBottom: '24px', fontSize: '18px' }}>REFERRAL PROGRAM</h3>
            <div className={styles.referralBox}>
              <p style={{ fontSize: '14px', color: '#8888BB', marginBottom: '16px' }}>
                Invite your friends and earn 5% from every ticket they purchase.
              </p>
              <div className={styles.referralLinkWrap}>
                <input 
                  type="text" 
                  readOnly 
                  value={`https://blockblast.vercel.app/r/${walletAddr.slice(0, 8)}`} 
                  className={styles.referralInput}
                />
                <button className="btn btn-primary btn-sm">COPY</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
