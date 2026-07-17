import { forwardRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { radiusVar, resolveSpace, type RadiusKey, type SpaceKey } from '../../utils/tokens-maps';
import styles from './Surface.module.css';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual elevation of the translucent container. */
  level?: 'base' | 'raised' | 'overlay';
  /** Adds hover/active affordances. */
  interactive?: boolean;
  /** Selected state — stronger border + subtle glow. */
  selected?: boolean;
  /** Inner padding on the 4px token scale. */
  padding?: SpaceKey;
  /** Corner radius token. Defaults to `lg`. */
  radius?: RadiusKey;
  as?: ElementType;
  children?: ReactNode;
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  {
    level = 'base',
    interactive = false,
    selected = false,
    padding,
    radius = 'lg',
    as,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const Tag = (as ?? 'div') as ElementType;
  const mergedStyle: CSSProperties = {
    padding: resolveSpace(padding),
    borderRadius: radiusVar[radius],
    ...style,
  };

  return (
    <Tag
      ref={ref}
      className={cx(
        styles.root,
        styles[level],
        interactive && styles.interactive,
        selected && styles.selected,
        className,
      )}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
});
