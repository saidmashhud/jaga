import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'neutral'
  | 'positive'
  | 'info'
  | 'warning'
  | 'danger'
  | 'ai';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Shows a small colored dot before the label. */
  dot?: boolean;
  children?: ReactNode;
}

export function Badge({
  variant = 'neutral',
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={cx(styles.root, styles[variant], className)} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
