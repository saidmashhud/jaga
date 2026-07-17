import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Text } from '../../primitives/Text/Text';
import styles from './Panel.module.css';

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Panel heading (overline style). */
  title?: ReactNode;
  /** Extra control rendered at the right edge of the header. */
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function Panel({ title, action, footer, className, children, ...rest }: PanelProps) {
  return (
    <section className={cx(styles.root, className)} {...rest}>
      {(title || action) && (
        <header className={styles.header}>
          {title && (
            <Text variant="overline" color="tertiary" as="h2">
              {title}
            </Text>
          )}
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={styles.content}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}
