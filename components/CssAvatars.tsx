'use client';

/**
 * CSS-Generated Avatar System — 12 unique designs, zero images needed.
 * Each avatar is built from pure SVG primitives + CSS gradients.
 */

export interface AvatarConfig {
  id: number;
  name: string;
  bg: string;
  symbol: string;
  symbolColor: string;
  glowColor: string;
}

export const AVATAR_CONFIGS: AvatarConfig[] = [
  { id: 0,  name: 'Phantom',    bg: 'linear-gradient(135deg, #9945FF, #5500AA)', symbol: '◈',  symbolColor: '#E8CCFF', glowColor: '#9945FF' },
  { id: 1,  name: 'Nova',       bg: 'linear-gradient(135deg, #00F5FF, #0088FF)', symbol: '◆',  symbolColor: '#CCFFFF', glowColor: '#00F5FF' },
  { id: 2,  name: 'Magma',      bg: 'linear-gradient(135deg, #FF6B00, #FF0040)', symbol: '▲',  symbolColor: '#FFE8CC', glowColor: '#FF6B00' },
  { id: 3,  name: 'Jade',       bg: 'linear-gradient(135deg, #00FF88, #00AA44)', symbol: '⬡',  symbolColor: '#CCFFE8', glowColor: '#00FF88' },
  { id: 4,  name: 'Volt',       bg: 'linear-gradient(135deg, #FFD700, #FF8C00)', symbol: '///', symbolColor: '#FFFFCC', glowColor: '#FFD700' },
  { id: 5,  name: 'Void',       bg: 'linear-gradient(135deg, #1A1A2E, #333355)', symbol: '◆',  symbolColor: '#8888BB', glowColor: '#AA00FF' },
  { id: 6,  name: 'Crystal',    bg: 'linear-gradient(135deg, #FF00FF, #AA0066)', symbol: '◇',  symbolColor: '#FFE0FF', glowColor: '#FF00FF' },
  { id: 7,  name: 'Glacier',    bg: 'linear-gradient(135deg, #00C3FF, #0040FF)', symbol: '///', symbolColor: '#E0F8FF', glowColor: '#00C3FF' },
  { id: 8,  name: 'Ember',      bg: 'linear-gradient(135deg, #FF4444, #990000)', symbol: '▲',  symbolColor: '#FFD0D0', glowColor: '#FF4444' },
  { id: 9,  name: 'Prism',      bg: 'linear-gradient(135deg, #00F5FF, #FF00FF)', symbol: '◉',  symbolColor: '#FFFFFF', glowColor: '#00F5FF' },
  { id: 10, name: 'Nebula',     bg: 'linear-gradient(135deg, #7700FF, #FF00AA)', symbol: '◈',  symbolColor: '#EED0FF', glowColor: '#7700FF' },
  { id: 11, name: 'Stealth',    bg: 'linear-gradient(135deg, #333344, #111122)', symbol: '⬟',  symbolColor: '#6666AA', glowColor: '#4444AA' },
];

interface CssAvatarProps {
  config: AvatarConfig;
  size?: number;
  selected?: boolean;
  walletInitial?: string;
}

export function CssAvatar({ config, size = 40, selected = false, walletInitial }: CssAvatarProps) {
  const fontSize = Math.max(12, size * 0.4);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: config.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        color: config.symbolColor,
        flexShrink: 0,
        position: 'relative',
        boxShadow: selected
          ? `0 0 0 2px ${config.glowColor}, 0 0 20px ${config.glowColor}80`
          : `0 2px 8px rgba(0,0,0,0.4)`,
        transition: 'box-shadow 0.2s',
        fontFamily: 'system-ui, sans-serif',
        lineHeight: 1,
      }}
    >
      <span style={{ userSelect: 'none' }}>
        {walletInitial || config.symbol}
      </span>
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            border: `2px solid ${config.glowColor}`,
            animation: 'spin 3s linear infinite',
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
}

/** Quick avatar picker grid used in profile + wallet dropdown */
interface AvatarPickerProps {
  selected: number;
  onSelect: (id: number) => void;
  size?: number;
}

export function AvatarPicker({ selected, onSelect, size = 52 }: AvatarPickerProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(6, ${size}px)`,
      gap: 10,
      justifyContent: 'center',
    }}>
      {AVATAR_CONFIGS.map((cfg) => (
        <button
          key={cfg.id}
          onClick={() => onSelect(cfg.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            borderRadius: '50%',
            transition: 'transform 0.15s',
            transform: selected === cfg.id ? 'scale(1.15)' : 'scale(1)',
          }}
          title={cfg.name}
        >
          <CssAvatar config={cfg} size={size} selected={selected === cfg.id} />
        </button>
      ))}
    </div>
  );
}
