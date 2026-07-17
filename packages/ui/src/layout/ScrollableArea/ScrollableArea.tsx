import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './ScrollableArea.module.css';

export interface ScrollableAreaProps extends HTMLAttributes<HTMLDivElement> {
  maxHeight?: CSSProperties['maxHeight'];
  /** Scroll direction. Defaults to vertical. */
  axis?: 'vertical' | 'horizontal' | 'both';
  children?: ReactNode;
}

export function ScrollableArea({
  maxHeight,
  axis = 'vertical',
  className,
  style,
  children,
  ...rest
}: ScrollableAreaProps) {
  return (
    <div
      className={cx(styles.root, styles[axis], className)}
      style={{ maxHeight, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
