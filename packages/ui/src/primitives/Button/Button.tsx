import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual role of the button. Defaults to `secondary`. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction while keeping the label visible. */
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled,
    iconLeft,
    iconRight,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        styles.root,
        styles[variant],
        styles[size],
        loading && styles.loading,
        className,
      )}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.content}>
        {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
        {children}
        {iconRight && <span className={styles.icon}>{iconRight}</span>}
      </span>
    </button>
  );
});
