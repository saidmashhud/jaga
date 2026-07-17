export type SpaceKey = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
export type RadiusKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'round';

export const spaceVar: Record<Exclude<SpaceKey, 0>, string> = {
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
};

export const radiusVar: Record<RadiusKey, string> = {
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  round: 'var(--radius-round)',
};

export function resolveSpace(key: SpaceKey | undefined): string | undefined {
  if (key === undefined || key === 0) return key === 0 ? '0' : undefined;
  return spaceVar[key];
}
