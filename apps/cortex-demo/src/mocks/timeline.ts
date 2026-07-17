import type { TimelineMockEvent, TimelinePointId, TimelineSceneState } from './types';

export interface TimelinePointMock {
  id: TimelinePointId;
  label: string;
  future?: boolean;
}

export const timelinePoints: TimelinePointMock[] = [
  { id: 'month-ago', label: 'Месяц назад' },
  { id: 'week-ago', label: 'Неделя назад' },
  { id: 'now', label: 'Сейчас' },
  { id: 'week-ahead', label: 'Через неделю', future: true },
  { id: 'month-ahead', label: 'Через месяц', future: true },
];

/** Mock scene states: how project statuses looked / are projected to look. */
export const timelineScenes: Record<TimelinePointId, TimelineSceneState> = {
  'month-ago': {
    statusOverrides: {
      metan: 'working',
      didi: 'working',
      kofeynya: 'stable',
      'invent-sale': 'working',
    },
    hint: 'Месяц назад: Metan ещё в работе, Кофейня стабильна, рисков нет.',
  },
  'week-ago': {
    statusOverrides: {
      didi: 'working',
      kofeynya: 'working',
      'invent-sale': 'attention',
    },
    hint: 'Неделя назад: Didi в работе, решение по invent.sale только назревало.',
  },
  now: {
    statusOverrides: {},
  },
  'week-ahead': {
    statusOverrides: {
      'invent-sale': 'working',
      kofeynya: 'stable',
      freelance: 'stable',
    },
    hint: 'Прогноз: после решения по пилоту invent.sale переходит в работу, Кофейня стабилизируется.',
  },
  'month-ahead': {
    statusOverrides: {
      'invent-sale': 'stable',
      didi: 'working',
      metan: 'attention',
      kofeynya: 'stable',
    },
    hint: 'Прогноз на месяц: пилот запущен, Didi выравнивается, Metan потребует решения по возобновлению.',
  },
};

/** Event dots on the timeline track (0–100 across the full range). */
export const timelineEvents: TimelineMockEvent[] = [
  {
    id: 'te-metan-pause',
    projectId: 'metan',
    position: 12,
    type: 'update',
    intensity: 2,
    label: 'Metan — проект поставлен на паузу',
  },
  {
    id: 'te-didi-delay',
    projectId: 'didi',
    position: 34,
    type: 'risk',
    intensity: 3,
    label: 'Didi — срыв сроков подрядчика',
  },
  {
    id: 'te-kofeynya-costs',
    projectId: 'kofeynya',
    position: 42,
    type: 'deadline',
    intensity: 2,
    label: 'Кофейня — рост расходов на 14%',
  },
  {
    id: 'te-nexus-release',
    projectId: 'nexus',
    position: 47,
    type: 'update',
    intensity: 1,
    label: 'Nexus — релиз отложен на 3 дня',
  },
  {
    id: 'te-invent-deadline',
    projectId: 'invent-sale',
    position: 58,
    type: 'decision',
    intensity: 3,
    label: 'invent.sale — дедлайн решения по пилоту',
    future: true,
  },
  {
    id: 'te-freelance-estimate',
    projectId: 'freelance',
    position: 64,
    type: 'deadline',
    intensity: 1,
    label: 'Фриланс — сдать оценку клиенту',
    future: true,
  },
  {
    id: 'te-metan-restart',
    projectId: 'metan',
    position: 88,
    type: 'decision',
    intensity: 2,
    label: 'Metan — решение о возобновлении',
    future: true,
  },
];
