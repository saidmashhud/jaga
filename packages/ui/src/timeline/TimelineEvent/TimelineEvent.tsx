import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import { Tooltip } from '../../primitives/Tooltip/Tooltip';
import styles from './TimelineEvent.module.css';

export interface TimelineEventProps extends HTMLAttributes<HTMLSpanElement> {
  /** Horizontal position on the track, 0–100 (%). */
  position: number;
  /** Human-readable label shown in the tooltip («Nexus — релиз отложен»). */
  label: string;
  type?: 'update' | 'risk' | 'decision' | 'deadline';
  /** Visual weight → dot size. */
  intensity?: 1 | 2 | 3;
  /** CSS color; defaults by type. */
  color?: string;
  selected?: boolean;
  /** Future events render outlined. */
  future?: boolean;
}

const typeColor: Record<NonNullable<TimelineEventProps['type']>, string> = {
  update: 'var(--color-accent-blue)',
  risk: 'var(--color-state-risk)',
  decision: 'var(--color-state-decision)',
  deadline: 'var(--color-state-attention)',
};

/** Event dot on the Timeline track. */
export function TimelineEvent({
  position,
  label,
  type = 'update',
  intensity = 1,
  color,
  selected = false,
  future = false,
  className,
  style,
  ...rest
}: TimelineEventProps) {
  const dotColor = color ?? typeColor[type];

  return (
    <Tooltip content={label} placement="top" delay={150}>
      <span
        tabIndex={0}
        role="img"
        aria-label={label}
        className={cx(
          styles.root,
          styles[`intensity${intensity}`],
          future && styles.future,
          selected && styles.selected,
          className,
        )}
        style={{ left: `${position}%`, '--event-color': dotColor, ...style } as React.CSSProperties}
        {...rest}
      />
    </Tooltip>
  );
}
