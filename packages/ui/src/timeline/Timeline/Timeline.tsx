import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Timeline.module.css';

export interface TimelinePoint {
  id: string;
  /** «Неделя назад», «Сейчас», «Через неделю»… */
  label: string;
  /** Future points render with a distinct style. */
  future?: boolean;
}

export type TimelinePeriod = 'week' | 'month';

export interface TimelineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  points: TimelinePoint[];
  /** Currently selected point. */
  activeId: string;
  /** The point that represents «now» (gets the beacon marker). */
  nowId?: string;
  onSelect?: (id: string) => void;
  period?: TimelinePeriod;
  onPeriodChange?: (period: TimelinePeriod) => void;
  /** TimelineEvent elements, positioned on the track. */
  children?: ReactNode;
}

const periodLabels: Record<TimelinePeriod, string> = {
  week: 'Неделя',
  month: 'Месяц',
};

/**
 * Bottom time strip: past/future scene states, event dots, period selector.
 * Arrow keys move between points.
 */
export function Timeline({
  points,
  activeId,
  nowId,
  onSelect,
  period = 'week',
  onPeriodChange,
  className,
  children,
  ...rest
}: TimelineProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const index = points.findIndex((p) => p.id === activeId);
    if (index === -1) return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = points[Math.max(0, Math.min(points.length - 1, index + delta))];
    if (next && next.id !== activeId) onSelect?.(next.id);
  };

  return (
    <div className={cx(styles.root, className)} {...rest}>
      <div
        className={styles.track}
        role="group"
        aria-label="Временная линия"
        onKeyDown={handleKeyDown}
      >
        <span className={styles.line} aria-hidden="true" />
        <span className={styles.events}>{children}</span>
        <div className={styles.points}>
          {points.map((point) => {
            const isActive = point.id === activeId;
            const isNow = point.id === nowId;
            return (
              <button
                key={point.id}
                type="button"
                className={cx(
                  styles.point,
                  isActive && styles.pointActive,
                  isNow && styles.pointNow,
                  point.future && styles.pointFuture,
                )}
                aria-pressed={isActive}
                onClick={() => onSelect?.(point.id)}
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.pointLabel}>{point.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {onPeriodChange && (
        <div className={styles.periods} role="group" aria-label="Период">
          {(Object.keys(periodLabels) as TimelinePeriod[]).map((key) => (
            <button
              key={key}
              type="button"
              className={cx(styles.period, period === key && styles.periodActive)}
              aria-pressed={period === key}
              onClick={() => onPeriodChange(key)}
            >
              {periodLabels[key]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
