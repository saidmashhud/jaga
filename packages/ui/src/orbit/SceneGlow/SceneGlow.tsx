import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './SceneGlow.module.css';

export interface SceneGlowProps extends HTMLAttributes<HTMLDivElement> {
  /** Center, in scene coordinates. */
  x: number;
  y: number;
  /** Diameter in px. */
  size?: number;
  /** Any CSS color; alpha is applied by the gradient. */
  color?: string;
  visible?: boolean;
}

/** Radial glow rendered under a highlighted scene object. */
export function SceneGlow({
  x,
  y,
  size = 320,
  color = 'var(--color-accent-violet)',
  visible = true,
  className,
  style,
  ...rest
}: SceneGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(styles.root, visible && styles.visible, className)}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        // color-mix keeps the token opaque while the gradient fades it out
        background: `radial-gradient(circle, color-mix(in srgb, ${color} 22%, transparent) 0%, transparent 68%)`,
        ...style,
      }}
      {...rest}
    />
  );
}
