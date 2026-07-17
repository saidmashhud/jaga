import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './Divider.module.css';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Divider({
  orientation = 'horizontal',
  className,
  ...rest
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cx(styles.root, styles[orientation], className)}
      {...rest}
    />
  );
}
