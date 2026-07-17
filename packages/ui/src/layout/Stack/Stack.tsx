import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { resolveSpace, type SpaceKey } from '../../utils/tokens-maps';
import styles from './Stack.module.css';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  direction?: 'vertical' | 'horizontal';
  /** Gap on the 4px token scale. */
  gap?: SpaceKey;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  as?: ElementType;
  children?: ReactNode;
}

export function Stack({
  direction = 'vertical',
  gap = 3,
  align,
  justify,
  wrap = false,
  as,
  className,
  style,
  children,
  ...rest
}: StackProps) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      className={cx(styles.root, styles[direction], className)}
      style={{
        gap: resolveSpace(gap),
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
