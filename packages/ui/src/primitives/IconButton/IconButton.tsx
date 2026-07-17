import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './IconButton.module.css';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Accessible name — required, icon-only controls have no visible text. */
  'aria-label': string;
  variant?: 'ghost' | 'surface' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  /** Toggled/active visual state (e.g. voice input while listening). */
  active?: boolean;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = 'ghost', size = 'md', active = false, className, children, type = 'button', ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={active || undefined}
        className={cx(
          styles.root,
          styles[variant],
          styles[size],
          active && styles.active,
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
