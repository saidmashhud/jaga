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
import type { ConnectionKind, SceneShape } from './cortex-api';

export interface ComposerResult {
  event: ActivityEvent;
  /** Mock parsing confirmation: «Добавлено в проект …». */
  confirmation: string;
}

let composerCounter = 0;

/**
 * Живой источник данных.
 *
 * Компоненты читают синхронно, а сеть асинхронна, поэтому подмена делается не
 * заменой объекта службы, а заменой того, что она отдаёт: данные загружаются
 * один раз до отрисовки и кладутся сюда. Пусто — приложение работает на моках,
 * и это рабочее состояние, а не поломка: стенд без службы обязан открываться.
 */
const live: {
  projects?: Project[];
  recommendation?: import('../mocks/types').Recommendation | null;
  connections?: typeof connections;
  focus?: typeof focusItems;
  lenses?: typeof lenses;
  activities?: ActivityEvent[];
  trackEvents?: typeof timelineEvents;
  kinds?: ConnectionKind[];
  shape?: SceneShape | null;
} = {};

/** Кто хочет знать, что данные сменились. */
const listeners = new Set<() => void>();

/**
 * Заполняется при старте и потом при каждом обновлении.
 *
 * Раньше это происходило ровно один раз: человек писал в композер, модель
 * разбирала запись через минуты, событие ложилось в базу — и экран об этом
 * не узнавал никогда. Круг замыкается только здесь.
 */
export function hydrate(data: Partial<typeof live>): void {
  Object.assign(live, data);
  listeners.forEach((fn) => fn());
}

/** Подписка на обновление данных. Возвращает отписку. */
export function onData(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Работает ли приложение на живых данных — нужно интерфейсу и журналу. */
export function isLive(): boolean {
  return Boolean(live.projects?.length);
}

/**
 * Откуда взялись данные на экране.
 *
 * Отдельно от isLive(), который отвечает на другой вопрос — «есть ли что
 * показать». Живое, но пустое пространство он объявляет неживым, и всё, что
 * решается по нему, ведёт себя так, будто человек смотрит образец: кнопка
 * заведения связи там прячется ровно в тот единственный день, когда она
 * нужнее всего.
 */
let source: 'live' | 'sample' | 'unknown' = 'unknown';

export function markSource(value: 'live' | 'sample'): void {
  source = value;
}

export function dataSource(): 'live' | 'sample' | 'unknown' {
  return source;
}

const liveById = () => new Map((live.projects ?? []).map((p) => [p.id, p]));

export const mockCortexService = {
  getProjects: (): Project[] => live.projects ?? projects,
  getProject: (id: string) => (live.projects ? liveById().get(id) : projectById.get(id)),
  getProjectColor: (id: string) => projectColorVar[id] ?? 'var(--color-accent-blue)',
  getConnections: () => live.connections ?? connections,
  // Без фолбэка на образец: пустой список означает, что служба не отдала виды,
  // и форма должна об этом сказать, а не подсунуть свой словарь, который
  // служба может не принять.
  getConnectionKinds: (): ConnectionKind[] => live.kinds ?? [],
  // Устройство сцены. null означает, что служба его не отдала: сцена тогда
  // рисует узлы без колец, а не выдумывает свои радиусы.
  getSceneShape: (): SceneShape | null => live.shape ?? null,
  getFocusItems: () => live.focus ?? focusItems,
  getActivities: () => live.activities ?? activities,
  // На живых данных рекомендация — это бриф, собранный моделью по фактам.
  // Нет брифа — нет блока: выдуманный совет хуже пустого места, что и
  // показала захардкоженная «AI-рекомендация» про чужой проект в пустом
  // пространстве.
  getRecommendation: () => (live.projects ? (live.recommendation ?? null) : recommendation),
  getLenses: () => live.lenses ?? lenses,
  getTimelinePoints: () => timelinePoints,
  getTimelineScene: (pointId: string) =>
    timelineScenes[pointId as keyof typeof timelineScenes] ?? timelineScenes.now,
  getTimelineEvents: () => live.trackEvents ?? timelineEvents,

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
