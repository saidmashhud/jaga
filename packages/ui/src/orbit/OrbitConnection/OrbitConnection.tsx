import type { SVGProps } from 'react';
import { cx } from '../../utils/cx';
import styles from './OrbitConnection.module.css';

export interface ScenePoint {
  x: number;
  y: number;
}

export interface OrbitConnectionProps
  extends Omit<SVGProps<SVGGElement>, 'ref' | 'target'> {
  source: ScenePoint;
  target: ScenePoint;
  /** Line color (CSS color). Defaults to a neutral border tone. */
  color?: string;
  /** Visual weight of the relation. */
  strength?: 1 | 2 | 3;
  /** Flowing dash animation along the path. */
  animated?: boolean;
  dashed?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  /** Curve bend as a fraction of the segment length. */
  curvature?: number;
}

/** Quadratic-bezier control point used by the connection path. */
export function connectionControlPoint(
  source: ScenePoint,
  target: ScenePoint,
  curvature = 0.14,
): ScenePoint {
  const mx = (source.x + target.x) / 2;
  const my = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy) || 1;
  // perpendicular offset, stable direction
  return {
    x: mx + (-dy / length) * length * curvature,
    y: my + (dx / length) * length * curvature,
  };
}

/** Point on the quadratic curve at parameter t ∈ [0, 1]. */
export function connectionPointAt(
  source: ScenePoint,
  target: ScenePoint,
  t: number,
  curvature = 0.14,
): ScenePoint {
  const c = connectionControlPoint(source, target, curvature);
  const mt = 1 - t;
  return {
    x: mt * mt * source.x + 2 * mt * t * c.x + t * t * target.x,
    y: mt * mt * source.y + 2 * mt * t * c.y + t * t * target.y,
  };
}

/** Point on the curve at t=0.5 — the default ConnectionLabel position. */
export function connectionMidpoint(
  source: ScenePoint,
  target: ScenePoint,
  curvature = 0.14,
): ScenePoint {
  return connectionPointAt(source, target, 0.5, curvature);
}

const strengthWidth: Record<1 | 2 | 3, number> = { 1: 1, 2: 1.75, 3: 2.5 };

/**
 * SVG relation line between two scene objects.
 * Never intercepts pointer events — labels are separate components.
 */
export function OrbitConnection({
  source,
  target,
  color = 'rgba(135, 154, 194, 0.4)',
  strength = 1,
  animated = false,
  dashed = false,
  selected = false,
  dimmed = false,
  curvature = 0.14,
  className,
  ...rest
}: OrbitConnectionProps) {
  const c = connectionControlPoint(source, target, curvature);
  const d = `M ${source.x} ${source.y} Q ${c.x} ${c.y} ${target.x} ${target.y}`;

  return (
    <g
      className={cx(styles.root, dimmed && styles.dimmed, className)}
      {...rest}
    >
      {selected && (
        <path
          className={styles.halo}
          d={d}
          stroke={color}
          strokeWidth={strengthWidth[strength] + 5}
        />
      )}
      <path
        className={cx(
          styles.line,
          animated && styles.animated,
          dashed && !animated && styles.dashed,
          selected && styles.selected,
        )}
        d={d}
        stroke={color}
        strokeWidth={selected ? strengthWidth[strength] + 0.75 : strengthWidth[strength]}
      />
    </g>
  );
}
