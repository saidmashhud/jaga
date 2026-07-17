import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './AppShell.module.css';

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed top bar. */
  header?: ReactNode;
  /** Left navigation rail. */
  navigation?: ReactNode;
  /** Right insights panel. Below 1280px it becomes an overlay. */
  aside?: ReactNode;
  /** Bottom input row, rendered inside the main workspace. */
  composer?: ReactNode;
  /** Overlay-mode visibility of the aside (only relevant below 1280px). */
  asideOpen?: boolean;
  /** Called when the overlay backdrop is clicked. */
  onAsideClose?: () => void;
  /** Main workspace content. */
  children?: ReactNode;
}

export function AppShell({
  header,
  navigation,
  aside,
  composer,
  asideOpen = false,
  onAsideClose,
  className,
  children,
  ...rest
}: AppShellProps) {
  return (
    <div className={cx(styles.root, className)} {...rest}>
      {header && <header className={styles.header}>{header}</header>}
      <div className={styles.body}>
        {navigation && <div className={styles.nav}>{navigation}</div>}
        <main className={styles.main}>
          <div className={styles.mainContent}>{children}</div>
          {composer && <div className={styles.composer}>{composer}</div>}
        </main>
        {aside && (
          <>
            <div
              className={cx(styles.backdrop, asideOpen && styles.backdropVisible)}
              onClick={onAsideClose}
              aria-hidden="true"
            />
            <aside className={cx(styles.aside, asideOpen && styles.asideOpen)}>
              {aside}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
