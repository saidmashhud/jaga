import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Tooltip } from '../../primitives/Tooltip/Tooltip';
import styles from './NavigationRailItem.module.css';

export interface NavigationRailItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  label: string;
  active?: boolean;
  /** Small counter/marker in the top-right corner of the icon. */
  badge?: ReactNode;
  disabled?: boolean;
}

export const NavigationRailItem = forwardRef<HTMLButtonElement, NavigationRailItemProps>(
  function NavigationRailItem(
    { icon, label, active = false, badge, disabled, className, ...rest },
    ref,
  ) {
    return (
      <Tooltip content={label} placement="right" delay={500} disabled={disabled}>
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          aria-current={active ? 'page' : undefined}
          className={cx(styles.root, active && styles.active, className)}
          {...rest}
        >
          <span className={styles.iconWrap}>
            {icon}
            {badge != null && badge !== false && (
              <span className={styles.badge}>{badge}</span>
            )}
          </span>
          <span className={styles.label}>{label}</span>
        </button>
      </Tooltip>
    );
  },
);
