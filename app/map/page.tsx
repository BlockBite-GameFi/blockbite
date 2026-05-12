'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from './map.module.css';

const ACTS = [
  { id: 1, name: 'Crystal Caverns',  range: [1,   500],  color: '#00F5FF', bg: '#00111A', icon: '💎', desc: 'Discover the deep gem mines' },
  { id: 2, name: 'Frozen Pass',       range: [501, 1000], color: '#7ADFFF', bg: '#000E1A', icon: '❄️', desc: 'Navigate icy corridors' },
  { id: 3, name: 'Ember Foundry',     range: [1001,1500], color: '#FF7A3A', bg: '#1A0800', icon: '🔥', desc: 'Chain combos in the forge' },
  { id: 4, name: 'Verdant Hollow',    range: [1501,2000], color: '#5FD07A', bg: '#021A08', icon: '🌿', desc: 'Regrow & nature overgrowth' },
  { id: 5, name: 'Abyss Tide',        range: [2001,2500], color: '#3A7AFF', bg: '#000A1A', icon: '🌊', desc: 'Surge through the depths' },
  { id: 6, name: 'Sandborn Dunes',    range: [2501,3000], color: '#FFD700', bg: '#1A1000', icon: '⚡', desc: 'Solar storms & mirages' },
  { id: 7, name: 'Voidline Citadel',  range: [3001,3500], color: '#A78BFF', bg: '#0A0014', icon: '🌌', desc: 'Portal storms & dark matter' },
  { id: 8, name: 'Apex Sanctum',      range: [3501,4000], color: '#FF3B6B', bg: '#0A0005', icon: '🏆', desc: 'Final boss gauntlet — glory awaits' },
] as const;

const LEVELS_PER_ROW = 5;

function getBossLevels(): Set<number> {
  const s = new Set<number>();
  for (let n = 100; n <= 4000; n += 100) s.add(n);
  return s;
}
const BOSS_LEVELS = getBossLevels();

interface LevelNodeProps {
  level: number;
  status: 'completed' | 'current' | 'locked';
  actColor: string;
  isBoss: boolean;
  onClick: () => void;
}

function LevelNode({ level, status, actColor, isBoss, onClick }: LevelNodeProps) {
  return (
    <button
      className={`${styles.node} ${styles[status]} ${isBoss ? styles.boss : ''}`}
      style={{
        '--act-color': actColor,
        '--act-glow': actColor + '55',
      } as React.CSSProperties}
      onClick={onClick}
      title={`Level ${level}${isBoss ? ' — BOSS' : ''}`}
      disabled={status === 'locked'}
    >
      <span className={styles.nodeNumber}>{isBoss ? '★' : level}</span>
      {status === 'completed' && <span className={styles.checkmark}>✓</span>}
    </button>
  );
}

export default function MapPage() {
  const router = useRouter();
  const [selectedAct, setSelectedAct] = useState(1);
  const [playerLevel, setPlayerLevel] = useState(1);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('bb_max_level') ?? '1');
    const lvl = isNaN(saved) || saved < 1 ? 1 : saved;
    setPlayerLevel(lvl);
    // Jump to the act that contains the player's current level
    const act = Math.min(8, Math.max(1, Math.ceil(lvl / 500)));
    setSelectedAct(act);
  }, []);

  const act = ACTS[selectedAct - 1];
  const [startLvl, endLvl] = act.range;
  const levels: number[] = [];
  for (let l = startLvl; l <= endLvl; l++) levels.push(l);

  // Build rows of LEVELS_PER_ROW, bottom-to-top (higher levels at top)
  const rows: number[][] = [];
  for (let i = 0; i < levels.length; i += LEVELS_PER_ROW) {
    rows.push(levels.slice(i, i + LEVELS_PER_ROW));
  }
  // Reverse so highest levels are at the top (like CandyCrush)
  rows.reverse();
  // Alternate row direction: odd rows (from bottom) go right, even rows go left
  const displayRows = rows.map((row, i) => {
    const originalIdx = rows.length - 1 - i;
    return originalIdx % 2 === 0 ? row : [...row].reverse();
  });

  const getStatus = (lvl: number): 'completed' | 'current' | 'locked' => {
    if (lvl < playerLevel) return 'completed';
    if (lvl === playerLevel) return 'current';
    return 'locked';
  };

  const handlePlay = (lvl: number) => {
    if (lvl > playerLevel) return;
    localStorage.setItem('bb_start_level', lvl.toString());
    router.push('/game');
  };

  return (
    <main className={styles.main} style={{ background: act.bg }}>
      <Navbar />

      {/* Act selector */}
      <div className={styles.actBar}>
        {ACTS.map(a => (
          <button
            key={a.id}
            className={`${styles.actTab} ${selectedAct === a.id ? styles.actTabActive : ''}`}
            style={{ '--act-color': a.color } as React.CSSProperties}
            onClick={() => setSelectedAct(a.id)}
          >
            <span className={styles.actIcon}>{a.icon}</span>
            <span className={styles.actName}>{a.name}</span>
          </button>
        ))}
      </div>

      {/* Act hero banner */}
      <div className={styles.actBanner}>
        <div className={styles.actBannerContent}>
          <div className={styles.actMeta}>
            <span className={styles.actNum} style={{ color: act.color }}>ACT {act.id}</span>
            <span className={styles.actRange}>Levels {startLvl}–{endLvl}</span>
          </div>
          <h2 className={styles.actTitle} style={{ color: act.color }}>{act.icon} {act.name}</h2>
          <p className={styles.actDesc}>{act.desc}</p>
        </div>
        <div className={styles.playerProgress}>
          <span className={styles.progressLabel}>YOUR PROGRESS</span>
          <span className={styles.progressLevel} style={{ color: act.color }}>
            LVL {playerLevel}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min(100, ((playerLevel - startLvl) / (endLvl - startLvl + 1)) * 100)}%`,
                background: act.color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Level map */}
      <div className={styles.mapScroll}>
        <div className={styles.mapContainer}>
          {displayRows.map((row, rowIdx) => (
            <div key={rowIdx} className={styles.levelRow}>
              {/* Path connector above */}
              {rowIdx < displayRows.length - 1 && (
                <div className={styles.rowConnector} style={{ borderColor: act.color + '33' }} />
              )}
              <div className={styles.rowNodes}>
                {row.map((lvl, nodeIdx) => {
                  const status = getStatus(lvl);
                  const isBoss = BOSS_LEVELS.has(lvl);
                  const isLast = nodeIdx === row.length - 1;
                  return (
                    <div key={lvl} className={styles.nodeWrapper}>
                      <LevelNode
                        level={lvl}
                        status={status}
                        actColor={act.color}
                        isBoss={isBoss}
                        onClick={() => handlePlay(lvl)}
                      />
                      {/* Horizontal connector */}
                      {!isLast && (
                        <div
                          className={`${styles.connector} ${status === 'completed' ? styles.connectorDone : ''}`}
                          style={{ background: status === 'completed' ? act.color : undefined }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Start banner at the bottom */}
          <div className={styles.startBanner}>
            <span style={{ color: act.color }}>↑ CLIMB TO THE TOP ↑</span>
          </div>
        </div>
      </div>

      {/* Play button */}
      <div className={styles.playBar}>
        <Link href="/game" className="btn btn-primary btn-lg" style={{ minWidth: 220 }}>
          ▶ PLAY LEVEL {playerLevel}
        </Link>
        <span style={{ color: '#55557A', fontSize: 12 }}>
          {playerLevel > 1 ? `${playerLevel - 1} levels cleared` : 'Start your journey'}
        </span>
      </div>
    </main>
  );
}
