import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './UserCoreNode.module.css';

export interface UserCoreNodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Main text. Defaults to «Вы». */
  title?: string;
  /** Secondary text. Defaults to «Сейчас». */
  subtitle?: string;
  /** Position in scene coordinates (center). */
  x: number;
  y: number;
  /** Soft breathing pulse — enable while a recommendation is active. */
  pulse?: boolean;
}

/** Central «You / Now» node of the orbit scene. */
export function UserCoreNode({
  title = 'Вы',
  subtitle = 'Сейчас',
  x,
  y,
  pulse = false,
  className,
  ...rest
}: UserCoreNodeProps) {
  return (
    <div
      className={cx(styles.root, pulse && styles.pulse, className)}
      style={{ left: x, top: y }}
      {...rest}
    >
      <span className={cx(styles.glow, styles.glowOuter)} aria-hidden="true" />
      <span className={cx(styles.glow, styles.glowMid)} aria-hidden="true" />
      <div className={styles.core}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </div>
    </div>
  );
}
