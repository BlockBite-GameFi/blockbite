/**
 * lib/theme.ts — Global CSS-variable token constants
 *
 * These strings reference CSS custom properties defined in app/globals.css.
 * The browser resolves them at paint time. The palette is locked to dark
 * mode (no theme switching), so values never change at runtime.
 *
 * Usage in inline styles:
 *   import { T } from '@/lib/theme';
 *   <div style={{ background: T.bg, color: T.text }} />
 */

// ─── Primary token map ────────────────────────────────────────────────────────
export const T = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:       'var(--ds-bg)',   // page background
  bg1:      'var(--ds-bg1)',  // card / panel background
  bg2:      'var(--ds-bg2)',  // nested / secondary panel

  // ── Surfaces (semi-transparent overlays) ─────────────────────────────────
  surface:  'var(--ds-surface)',   // ~4% overlay
  surface2: 'var(--ds-surface2)',  // ~35% overlay / modal bg

  // ── Text ─────────────────────────────────────────────────────────────────
  text:    'var(--ds-text)',      // primary text
  textDim: 'var(--ds-text-dim)', // muted / secondary text

  // ── Borders ──────────────────────────────────────────────────────────────
  border: 'var(--ds-border)',

  // ── Accent palette ────────────────────────────────────────────────────────
  accent:  'var(--ds-accent)',   // primary brand purple
  accent2: 'var(--ds-accent2)',  // secondary teal
  gold:    'var(--ds-gold)',
  blue:    'var(--ds-blue)',
  green:   'var(--ds-green)',
  red:     'var(--ds-red)',

  // ── Semantic ─────────────────────────────────────────────────────────────
  ok:     'var(--ds-ok)',
  warn:   'var(--ds-warn)',
  danger: 'var(--ds-danger)',

  // ── Semi-transparent accent helpers (use instead of ${accent}14 hex) ─────
  accentA1: 'var(--ds-accent-a1)',  // 6%  — subtle bg tint
  accentA2: 'var(--ds-accent-a2)',  // 12% — card bg
  accentA3: 'var(--ds-accent-a3)',  // 20% — hover bg
  accentA4: 'var(--ds-accent-a4)',  // 27% — accent border
  goldA1:   'var(--ds-gold-a1)',
  greenA1:  'var(--ds-green-a1)',
  redA1:    'var(--ds-red-a1)',
  blueA1:   'var(--ds-blue-a1)',

  // ── Gradients ────────────────────────────────────────────────────────────
  header: 'var(--ds-header)',  // page header gradient
  grad:   'var(--ds-grad)',    // primary CTA gradient

  // ── Typography ───────────────────────────────────────────────────────────
  mono:  "'JetBrains Mono', ui-monospace, monospace" as string,
  serif: "'Space Grotesk', system-ui, sans-serif" as string,
} as const;

export type ThemeToken = keyof typeof T;
