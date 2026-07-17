import type { HTMLAttributes } from 'react';
import { CheckIcon } from '@cortex/icons';
import { cx } from '../../utils/cx';
import { Badge } from '../../primitives/Badge/Badge';
import { ProgressRing } from '../../primitives/ProgressRing/ProgressRing';
import styles from './FocusTaskCard.module.css';

export interface FocusTaskCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  projectName: string;
  /** Main action the user should take. */
  title: string;
  description?: string;
  impact: 'high' | 'medium' | 'low';
  /** Semantic accent color of the related project (CSS color). */
  projectColor: string;
  completed?: boolean;
  /** Optional 0–100 progress of the task. */
  progress?: number;
  /** Card highlights when its project is selected on the scene. */
  selected?: boolean;
  loading?: boolean;
  /** Click on the card body — select the project on the canvas. */
  onSelect?: () => void;
  /** Checkbox toggle. */
  onToggleComplete?: (completed: boolean) => void;
}

const impactLabel: Record<FocusTaskCardProps['impact'], string> = {
  high: 'Высокий эффект',
  medium: 'Средний эффект',
  low: 'Низкий эффект',
};

const impactVariant: Record<FocusTaskCardProps['impact'], 'ai' | 'info' | 'neutral'> = {
  high: 'ai',
  medium: 'info',
  low: 'neutral',
};

/** Task requiring attention today, linked to a project on the scene. */
export function FocusTaskCard({
  projectName,
  title,
  description,
  impact,
  projectColor,
  completed = false,
  progress,
  selected = false,
  loading = false,
  onSelect,
  onToggleComplete,
  className,
  style,
  ...rest
}: FocusTaskCardProps) {
  return (
    <div
      className={cx(
        styles.root,
        completed && styles.completed,
        selected && styles.selected,
        loading && styles.loading,
        className,
      )}
      style={{ '--project-color': projectColor, ...style } as React.CSSProperties}
      {...rest}
    >
      <span className={styles.accent} aria-hidden="true" />
      <label className={styles.check} onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={completed}
          disabled={loading}
          onChange={(event) => onToggleComplete?.(event.target.checked)}
          aria-label={`Завершить: ${title}`}
        />
        <span className={styles.checkBox} aria-hidden="true">
          <CheckIcon size={12} />
        </span>
      </label>
      <button
        type="button"
        className={styles.body}
        onClick={onSelect}
        disabled={loading}
      >
        <span className={styles.meta}>
          <span className={styles.project}>{projectName}</span>
          <Badge variant={impactVariant[impact]}>{impactLabel[impact]}</Badge>
        </span>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </button>
      {loading ? (
        <ProgressRing size={26} thickness={2.5} aria-label="Загрузка" />
      ) : progress !== undefined ? (
        <ProgressRing
          size={26}
          thickness={2.5}
          value={progress}
          color="var(--project-color)"
          aria-label={`Прогресс: ${Math.round(progress)}%`}
        />
      ) : null}
    </div>
  );
}
