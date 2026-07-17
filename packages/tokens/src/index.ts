/**
 * Typed access to Cortex design tokens.
 * Values mirror tokens.css; the CSS custom property remains the source of truth
 * at runtime — TS constants exist for logic that needs token names or raw values
 * (charts, SVG attributes, tests).
 */

export type SemanticStatus =
  | 'stable'
  | 'working'
  | 'attention'
  | 'risk'
  | 'paused'
  | 'decision';

export type AccentColor =
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red';

/** CSS var() reference for each semantic status color. */
export const statusColorVar: Record<SemanticStatus | 'ai', string> = {
  stable: 'var(--color-state-stable)',
  working: 'var(--color-state-working)',
  attention: 'var(--color-state-attention)',
  risk: 'var(--color-state-risk)',
  paused: 'var(--color-state-paused)',
  decision: 'var(--color-state-decision)',
  ai: 'var(--color-state-ai)',
};

/** CSS var() reference for the soft translucent fill of each status. */
export const statusSoftColorVar: Record<SemanticStatus | 'ai', string> = {
  stable: 'var(--color-state-stable-soft)',
  working: 'var(--color-state-working-soft)',
  attention: 'var(--color-state-attention-soft)',
  risk: 'var(--color-state-risk-soft)',
  paused: 'var(--color-state-paused-soft)',
  decision: 'var(--color-state-decision-soft)',
  ai: 'var(--color-state-ai-soft)',
};

/** Glow shadow token matched to each status. */
export const statusGlowVar: Record<SemanticStatus | 'ai', string> = {
  stable: 'var(--glow-green)',
  working: 'var(--glow-blue)',
  attention: 'var(--glow-warning)',
  risk: 'var(--glow-risk)',
  paused: 'none',
  decision: 'var(--glow-cyan)',
  ai: 'var(--glow-ai)',
};

/** Raw hex values (dark theme) for contexts that cannot resolve CSS vars. */
export const rawColors = {
  bgRoot: '#050814',
  bgCanvas: '#070B18',
  textPrimary: '#F4F7FF',
  textSecondary: '#9DA8C1',
  textTertiary: '#66718C',
  accentViolet: '#7657FF',
  accentBlue: '#3597FF',
  accentCyan: '#37D9FF',
  accentGreen: '#75ED6F',
  accentYellow: '#FFC94A',
  accentOrange: '#FF7A45',
  accentRed: '#FF5B5B',
  stateStable: '#75ED6F',
  stateWorking: '#3597FF',
  stateAttention: '#FFC94A',
  stateRisk: '#FF6A4A',
  statePaused: '#5B6B8F',
  stateDecision: '#37D9FF',
  stateAi: '#9B7BFF',
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
} as const;

export const motion = {
  fast: 120,
  normal: 200,
  slow: 360,
  scene: 600,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body-lg'
  | 'body'
  | 'body-md'
  | 'caption'
  | 'overline';

export const typography: Record<
  TextVariant,
  { size: number; line: number; weight: number }
> = {
  display: { size: 32, line: 40, weight: 600 },
  h1: { size: 24, line: 32, weight: 600 },
  h2: { size: 20, line: 28, weight: 600 },
  h3: { size: 16, line: 24, weight: 600 },
  'body-lg': { size: 16, line: 24, weight: 400 },
  body: { size: 14, line: 20, weight: 400 },
  'body-md': { size: 14, line: 20, weight: 500 },
  caption: { size: 12, line: 16, weight: 400 },
  overline: { size: 11, line: 16, weight: 600 },
};

/** Human-readable status labels (ru) used across mock UI. */
export const statusLabels: Record<SemanticStatus, string> = {
  stable: 'Стабильно',
  working: 'В работе',
  attention: 'Требует внимания',
  risk: 'Риск',
  paused: 'На паузе',
  decision: 'Требует решения',
};
