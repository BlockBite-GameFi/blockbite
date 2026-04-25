'use client';

import { useState, useEffect } from 'react';
import { MysteryBox, BoxResult, generateMysteryBoxes, resolveMysteryBox, getMultiplierChance } from '@/lib/game/mysteryBox';
import { getBoxCount, isMysteryBoxLevel } from '@/lib/game/stages';
import styles from './MysteryBoxModal.module.css';

interface Props {
  level: number;
  currentScore: number;
  picksInSession: number;
  onResult: (result: BoxResult) => void;
}

export default function MysteryBoxModal({ level, currentScore, picksInSession, onResult }: Props) {
  const [boxes, setBoxes]       = useState<MysteryBox[]>([]);
  const [chosen, setChosen]     = useState<MysteryBox | null>(null);
  const [result, setResult]     = useState<BoxResult | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);

  useEffect(() => {
    if (!isMysteryBoxLevel(level)) return;
    const count = getBoxCount(level);
    const generated = generateMysteryBoxes({ level, boxes: new Array(count) as MysteryBox[], picksInSession });
    setBoxes(generated);
    setChosen(null);
    setResult(null);
    setRevealed([]);
  }, [level, picksInSession]);

  if (!isMysteryBoxLevel(level) || boxes.length === 0) return null;

  const multChance = getMultiplierChance(level, picksInSession);

  function pick(box: MysteryBox) {
    if (chosen) return;
    setChosen(box);
    // Reveal all boxes one by one, chosen box last
    const others = boxes.filter(b => b.id !== box.id).map(b => b.id);
    others.forEach((id, i) => {
      setTimeout(() => setRevealed(prev => [...prev, id]), (i + 1) * 400);
    });
    setTimeout(() => {
      setRevealed(prev => [...prev, box.id]);
      const r = resolveMysteryBox(box, currentScore);
      setResult(r);
      setTimeout(() => onResult(r), 1200);
    }, (others.length + 1) * 400 + 200);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.title}>⚡ MYSTERY BOX</div>
          <div className={styles.subtitle}>LEVEL {level} MILESTONE — PICK ONE</div>
        </div>

        <div className={styles.hintBar}>
          <span>🎯 Multiplier chance: <b className={styles.multPct}>{multChance}%</b></span>
          {picksInSession < 5 && <span className={styles.hintSub}>Pick {5 - picksInSession} more times to unlock higher multipliers</span>}
          {picksInSession >= 5 && <span className={styles.hintMax}>⚡ MAX REWARD MODE — big multipliers active!</span>}
        </div>

        <div className={styles.boxRow}>
          {boxes.map((box) => {
            const isRevealed = revealed.includes(box.id);
            const isChosen   = chosen?.id === box.id;
            const isBomb     = isRevealed && box.type === 'BOMB';
            return (
              <button
                key={box.id}
                type="button"
                className={`${styles.box} ${isRevealed ? styles.revealed : ''} ${isChosen ? styles.chosen : ''} ${isBomb ? styles.bomb : ''}`}
                onClick={() => pick(box)}
                disabled={!!chosen}
              >
                {isRevealed ? (
                  <>
                    <span className={styles.boxIcon}>{box.icon}</span>
                    <span className={styles.boxLabel}>{box.label}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.boxIcon}>?</span>
                    <span className={styles.boxLabel}>TAP TO OPEN</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {result && (
          <div className={`${styles.resultBar} ${result.halvScore ? styles.resultBomb : styles.resultGood}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
