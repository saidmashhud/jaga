import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './ActivityItem.module.css';

export interface ActivityItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  projectName: string;
  /** Event description; clamps to two lines. */
  title: string;
  /** Relative time label («2 ч назад»). */
  timeLabel: string;
  /** Project icon; falls back to the first letter. */
  icon?: ReactNode;
  /** Semantic accent color of the project (CSS color). */
  projectColor?: string;
  selected?: boolean;
  /** Marks the item as freshly added (short highlight). */
  fresh?: boolean;
}

/** A recent change in the «Что происходит» feed. Click selects the project. */
export function ActivityItem({
  projectName,
  title,
  timeLabel,
  icon,
  projectColor = 'var(--color-accent-blue)',
  selected = false,
  fresh = false,
  className,
  style,
  ...rest
}: ActivityItemProps) {
  return (
    <button
      type="button"
      className={cx(
        styles.root,
        selected && styles.selected,
        fresh && styles.fresh,
        className,
      )}
      style={{ '--project-color': projectColor, ...style } as React.CSSProperties}
      {...rest}
    >
      <span className={styles.iconWrap} aria-hidden="true">
        {icon ?? projectName.charAt(0).toUpperCase()}
      </span>
      <span className={styles.content}>
        <span className={styles.project}>{projectName}</span>
        <span className={styles.title}>{title}</span>
      </span>
      <time className={styles.time}>{timeLabel}</time>
    </button>
  );
}
