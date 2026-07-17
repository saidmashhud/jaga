import type { SVGProps } from 'react';
import { cx } from '../../utils/cx';
import styles from './OrbitRing.module.css';

export interface OrbitRingProps extends SVGProps<SVGEllipseElement> {
  cx?: number;
  cy?: number;
  /** Radius; use `ry` for an elliptical ring. */
  r: number;
  ry?: number;
  dashed?: boolean;
  opacity?: number;
}

/** Faint background orbit line inside the OrbitCanvas SVG layer. */
export function OrbitRing({
  cx: centerX = 0,
  cy: centerY = 0,
  r,
  ry,
  dashed = false,
  opacity = 1,
  className,
  ...rest
}: OrbitRingProps) {
  return (
    <ellipse
      className={cx(styles.root, dashed && styles.dashed, className)}
      cx={centerX}
      cy={centerY}
      rx={r}
      ry={ry ?? r}
      opacity={opacity}
      {...rest}
    />
  );
}
