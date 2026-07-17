import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { statusLabels, type SemanticStatus } from '@cortex/tokens';
import { cx } from '../../utils/cx';
import styles from './ProjectNode.module.css';

export type ProjectStatus = SemanticStatus;

export interface ProjectNodeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'title' | 'onSelect'> {
  id: string;
  title: string;
  subtitle?: string;
  /** Icon inside the circle; falls back to the first letter of the title. */
  icon?: ReactNode;
  status: ProjectStatus;
  /** Localized status text. Defaults to the token label for the status. */
  statusLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  /** Lens/hover filtering: node fades back. */
  dimmed?: boolean;
  /** Recently updated — one-shot highlight pulse. */
  updated?: boolean;
  /** Position in scene coordinates (node center). */
  x: number;
  y: number;
  /** Short summary shown in the hover/focus tooltip. */
  hoverSummary?: string;
  onSelect?: (id: string) => void;
  onHoverChange?: (id: string, hovered: boolean) => void;
}

/** Primary project object on the orbit scene. */
export function ProjectNode({
  id,
  title,
  subtitle,
  icon,
  status,
  statusLabel,
  size = 'md',
  selected = false,
  dimmed = false,
  updated = false,
  x,
  y,
  hoverSummary,
  onSelect,
  onHoverChange,
  className,
  ...rest
}: ProjectNodeProps) {
  const tooltipId = useId();
  const label = statusLabel ?? statusLabels[status];

  return (
    <div
      className={cx(
        styles.root,
        styles[size],
        styles[status],
        selected && styles.selected,
        dimmed && styles.dimmed,
        updated && styles.updated,
        className,
      )}
      style={{ left: x, top: y }}
      data-node-id={id}
      onMouseEnter={() => onHoverChange?.(id, true)}
      onMouseLeave={() => onHoverChange?.(id, false)}
      {...rest}
    >
      <button
        type="button"
        className={styles.circle}
        aria-pressed={selected}
        aria-label={`${title}. ${label}`}
        aria-describedby={hoverSummary ? tooltipId : undefined}
        onClick={() => onSelect?.(id)}
        onFocus={() => onHoverChange?.(id, true)}
        onBlur={() => onHoverChange?.(id, false)}
      >
        <span className={styles.halo} aria-hidden="true" />
        <span className={styles.inner} aria-hidden="true">
          {icon ?? title.charAt(0).toUpperCase()}
        </span>
        <span className={styles.statusDot} aria-hidden="true" />
      </button>
      <div className={styles.meta}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        <div className={styles.statusText}>{label}</div>
      </div>
      {hoverSummary && (
        <div role="tooltip" id={tooltipId} className={styles.tooltip}>
          {hoverSummary}
        </div>
      )}
    </div>
  );
}
