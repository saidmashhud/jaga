import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import type { TextVariant } from '@cortex/tokens';
import { cx } from '../../utils/cx';
import styles from './Text.module.css';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'ai'
  | 'inherit';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Typographic scale step. Defaults to `body`. */
  variant?: TextVariant;
  /** Semantic text color. Defaults to `primary`. */
  color?: TextColor;
  /** Overrides the variant's font weight. */
  weight?: 400 | 500 | 600;
  /** `true` — single-line ellipsis, `2 | 3` — multi-line clamp. */
  truncate?: boolean | 2 | 3;
  /** Rendered element. Headings map to h1–h3 automatically. */
  as?: ElementType;
  children?: ReactNode;
}

const defaultTag: Partial<Record<TextVariant, ElementType>> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
};

const variantClass: Record<TextVariant, string> = {
  display: styles.display,
  h1: styles.h1,
  h2: styles.h2,
  h3: styles.h3,
  'body-lg': styles.bodyLg,
  body: styles.body,
  'body-md': styles.bodyMd,
  caption: styles.caption,
  overline: styles.overline,
};

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  truncate,
  as,
  className,
  style,
  children,
  ...rest
}: TextProps) {
  const Tag = as ?? defaultTag[variant] ?? 'span';
  const mergedStyle: CSSProperties | undefined = weight
    ? { fontWeight: weight, ...style }
    : style;

  return (
    <Tag
      className={cx(
        styles.root,
        variantClass[variant],
        styles[color],
        truncate === true && styles.truncate,
        truncate === 2 && styles.clamp2,
        truncate === 3 && styles.clamp3,
        className,
      )}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
}
