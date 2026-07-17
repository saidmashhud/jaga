import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { ProgressRing } from '../../primitives/ProgressRing/ProgressRing';
import styles from './LensChip.module.css';

export interface LensChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  /** Lens is applied to the scene. */
  active?: boolean;
  loading?: boolean;
  children: ReactNode;
}

/** Quick question / scene filter chip. */
export const LensChip = forwardRef<HTMLButtonElement, LensChipProps>(
  function LensChip(
    { icon, active = false, loading = false, className, children, disabled, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-pressed={active}
        className={cx(styles.root, active && styles.active, className)}
        {...rest}
      >
        {loading ? (
          <ProgressRing size={14} thickness={2} color="var(--color-accent-cyan)" aria-label="Применение линзы" />
        ) : (
          icon && <span className={styles.icon}>{icon}</span>
        )}
        <span className={styles.label}>{children}</span>
      </button>
    );
  },
);
