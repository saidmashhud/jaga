import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { AiIcon, ChevronDownIcon } from '@cortex/icons';
import { cx } from '../../utils/cx';
import styles from './RecommendationCard.module.css';

export interface RecommendationCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string;
  description: string;
  /** «Почему?» content revealed in the expanded state. */
  reasons?: string[];
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** Action buttons row. */
  actions?: ReactNode;
}

/** AI recommendation card with an expandable explanation. */
export function RecommendationCard({
  title,
  description,
  reasons = [],
  expanded = false,
  onToggleExpand,
  actions,
  className,
  ...rest
}: RecommendationCardProps) {
  const reasonsId = useId();

  return (
    <div className={cx(styles.root, className)} {...rest}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.aiIcon} aria-hidden="true">
            <AiIcon size={16} />
          </span>
          <span className={styles.overline}>AI-рекомендация</span>
        </div>
        <div className={styles.title}>{title}</div>
        <p className={styles.description}>{description}</p>
        {reasons.length > 0 && (
          <>
            <button
              type="button"
              className={styles.whyButton}
              aria-expanded={expanded}
              aria-controls={reasonsId}
              onClick={onToggleExpand}
            >
              Почему?
              <ChevronDownIcon
                size={14}
                className={cx(styles.chevron, expanded && styles.chevronOpen)}
              />
            </button>
            {expanded && (
              <ul id={reasonsId} className={styles.reasons}>
                {reasons.map((reason, index) => (
                  <li
                    key={reason}
                    className={styles.reason}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
