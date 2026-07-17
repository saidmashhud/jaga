/**
 * Mock data-access layer. The UI talks only to this service, so a real
 * API client can replace it later without touching components.
 */
import { activities } from '../mocks/activities';
import { connections } from '../mocks/connections';
import { focusItems } from '../mocks/focus-items';
import { lenses } from '../mocks/lenses';
import { projectById, projectColorVar, projects } from '../mocks/projects';
import { recommendation } from '../mocks/recommendations';
import { timelineEvents, timelinePoints, timelineScenes } from '../mocks/timeline';
import type { ActivityEvent, Project } from '../mocks/types';

export interface ComposerResult {
  event: ActivityEvent;
  /** Mock parsing confirmation: «Добавлено в проект …». */
  confirmation: string;
}

let composerCounter = 0;

export const mockCortexService = {
  getProjects: (): Project[] => projects,
  getProject: (id: string) => projectById.get(id),
  getProjectColor: (id: string) => projectColorVar[id] ?? 'var(--color-accent-blue)',
  getConnections: () => connections,
  getFocusItems: () => focusItems,
  getActivities: () => activities,
  getRecommendation: () => recommendation,
  getLenses: () => lenses,
  getTimelinePoints: () => timelinePoints,
  getTimelineScene: (pointId: string) =>
    timelineScenes[pointId as keyof typeof timelineScenes] ?? timelineScenes.now,
  getTimelineEvents: () => timelineEvents,

  /**
   * Mock context ingestion: naive project matching by title mention,
   * fake deadline extraction, 600–1000 ms of «processing».
   */
  submitContext(text: string, fallbackProjectId?: string | null): Promise<ComposerResult> {
    const lower = text.toLowerCase();
    const matched =
      projects.find((p) => lower.includes(p.title.toLowerCase())) ??
      projects.find((p) => p.id === 'kofeynya' && /кофейн/.test(lower)) ??
      (fallbackProjectId ? projectById.get(fallbackProjectId) : undefined);

    const project = matched ?? projectById.get('nexus')!;
    const deadline = lower.match(
      /до\s+(понедельника|вторника|среды|четверга|пятницы|субботы|воскресенья|завтра|конца недели)/,
    )?.[1];

    const event: ActivityEvent = {
      id: `a-composer-${++composerCounter}`,
      projectId: project.id,
      title: text,
      createdAt: new Date().toISOString(),
      type: deadline ? 'deadline' : 'update',
    };

    const confirmation = deadline
      ? `Добавлено в проект «${project.title}»: задача, срок — ${deadline}.`
      : `Добавлено в проект «${project.title}».`;

    return new Promise((resolve) => {
      setTimeout(() => resolve({ event, confirmation }), 800);
    });
  },
};
