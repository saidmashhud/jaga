import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { resolveSpace, type SpaceKey } from '../../utils/tokens-maps';
import styles from './Grid.module.css';

export interface GridProps extends HTMLAttributes<HTMLElement> {
  /** Column count, or a raw grid-template-columns value. */
  columns?: number | string;
  gap?: SpaceKey;
  as?: ElementType;
  children?: ReactNode;
}

export function Grid({
  columns = 2,
  gap = 4,
  as,
  className,
  style,
  children,
  ...rest
}: GridProps) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      className={cx(styles.root, className)}
      style={{
        gridTemplateColumns:
          typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns,
        gap: resolveSpace(gap),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
