import type { HTMLAttributes } from 'react';
import type { SemanticStatus } from '@cortex/tokens';
import { cx } from '../../utils/cx';
import styles from './StatusDot.module.css';

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  status: SemanticStatus | 'ai';
  /** Soft looping pulse. Keep to 1–2 pulsing elements per screen. */
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusDot({
  status,
  pulse = false,
  size = 'md',
  className,
  ...rest
}: StatusDotProps) {
  return (
    <span
      className={cx(
        styles.root,
        styles[status],
        styles[size],
        pulse && styles.pulse,
        className,
      )}
      {...rest}
    />
  );
}
