import type { IconName } from '@cortex/icons';
import type { ProjectStatus } from '@cortex/ui';

export type { ProjectStatus };

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  shortCode?: string;
  icon?: IconName;
  status: ProjectStatus;
  statusLabel: string;
  /**
   * Место на сцене. `z` остаётся в ответе службы, но больше никем не рисуется:
   * сцена стала плоской, и глубина, несшая ось внимания, переехала в
   * расстояние от ядра.
   */
  position: { x: number; y: number; z: number };
  /**
   * Пояс внимания, 1..6 от ядра наружу: решение, риск, внимание, в работе,
   * стабильно, на паузе. Считает служба — она же расставляет узлы, и вторая
   * таблица радиусов на странице разошлась бы с ней при первом же новом
   * состоянии.
   */
  belt?: number;
  /** Состояние незнакомо, пояс подставлен. Такой узел рисуется пунктиром. */
  beltGuessed?: boolean;
  size: 'sm' | 'md' | 'lg';
  updatedAt: string;
  summary: string;
}

export type ConnectionType =
  | 'resource'
  | 'finance'
  | 'dependency'
  | 'team'
  | 'client'
  | 'knowledge';

export interface ProjectConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  /** Label position along the curve, 0–1. Defaults to the midpoint. */
  labelT?: number;
  type: ConnectionType;
  strength: 1 | 2 | 3;
  animated?: boolean;
}

export interface FocusItem {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  impact: 'high' | 'medium' | 'low';
  completed: boolean;
  progress?: number;
}

export type ActivityType = 'update' | 'risk' | 'decision' | 'deadline';

export interface ActivityEvent {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  type: ActivityType;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  reasons: string[];
  projectIds: string[];
}

export type LensType = 'decisions' | 'risks' | 'money' | 'stale';

export interface Lens {
  id: string;
  title: string;
  type: LensType;
  /** Projects the lens keeps in focus; the rest are dimmed. */
  projectIds: string[];
  /** Short explanation shown when the lens is applied. */
  explanation: string;
}

export type TimelinePointId =
  | 'month-ago'
  | 'week-ago'
  | 'now'
  | 'week-ahead'
  | 'month-ahead';

export interface TimelineSceneState {
  /** Project status overrides for this point in time. */
  statusOverrides: Partial<Record<string, ProjectStatus>>;
  /** Hint displayed above the canvas for past/future states. */
  hint?: string;
}

export interface TimelineMockEvent {
  id: string;
  projectId: string;
  /** 0–100 position across the full track. */
  position: number;
  type: ActivityType;
  intensity: 1 | 2 | 3;
  label: string;
  future?: boolean;
}
