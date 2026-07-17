import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './ConnectionLabel.module.css';

export interface ConnectionLabelProps extends HTMLAttributes<HTMLDivElement> {
  /** Position in scene coordinates (usually connectionMidpoint). */
  x: number;
  y: number;
  dimmed?: boolean;
  /** Highlighted along with its connection. */
  emphasized?: boolean;
  children: ReactNode;
}

/** Short caption pinned to a connection midpoint. */
export function ConnectionLabel({
  x,
  y,
  dimmed = false,
  emphasized = false,
  className,
  children,
  ...rest
}: ConnectionLabelProps) {
  return (
    <div
      className={cx(
        styles.root,
        dimmed && styles.dimmed,
        emphasized && styles.emphasized,
        className,
      )}
      style={{ left: x, top: y }}
      {...rest}
    >
      {children}
    </div>
  );
}
