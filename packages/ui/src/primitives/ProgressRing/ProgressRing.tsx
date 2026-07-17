import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './ProgressRing.module.css';

export interface ProgressRingProps extends HTMLAttributes<HTMLSpanElement> {
  /** 0–100. Omit for the indeterminate (spinning) state. */
  value?: number;
  /** Outer diameter in px. Defaults to 32. */
  size?: number;
  /** Stroke width in px. Defaults to 3. */
  thickness?: number;
  /** Any CSS color; defaults to the violet accent. */
  color?: string;
  /** Renders the numeric value in the center (fits sizes >= 32). */
  showValue?: boolean;
  /** Accessible label for the progress. */
  'aria-label'?: string;
}

export function ProgressRing({
  value,
  size = 32,
  thickness = 3,
  color = 'var(--color-accent-violet)',
  showValue = false,
  className,
  ...rest
}: ProgressRingProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const indeterminate = value === undefined;
  const clamped = indeterminate ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <span
      className={cx(styles.root, className)}
      role="progressbar"
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-valuenow={indeterminate ? undefined : clamped}
      style={{ width: size, height: size }}
      {...rest}
    >
      <svg
        className={cx(styles.svg, indeterminate && styles.spinning)}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
        />
        <circle
          className={styles.indicator}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.72 : offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showValue && !indeterminate && (
        <span className={styles.value} style={{ fontSize: Math.max(9, size * 0.28) }}>
          {Math.round(clamped)}
        </span>
      )}
    </span>
  );
}
