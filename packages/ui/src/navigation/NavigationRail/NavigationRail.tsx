import { useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './NavigationRail.module.css';

export interface NavigationRailProps extends HTMLAttributes<HTMLElement> {
  'aria-label'?: string;
  children?: ReactNode;
}

/**
 * Vertical navigation rail. Arrow keys move focus between items
 * (roving focus over the rendered NavigationRailItem buttons).
 */
export function NavigationRail({
  className,
  children,
  'aria-label': ariaLabel = 'Основная навигация',
  ...rest
}: NavigationRailProps) {
  const ref = useRef<HTMLElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    event.preventDefault();
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const next = items[(index + delta + items.length) % items.length];
    next?.focus();
  };

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={cx(styles.root, className)}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </nav>
  );
}
