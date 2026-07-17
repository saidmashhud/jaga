import type { ActivityEvent } from './types';

const HOUR = 3_600_000;
const now = Date.now();

export const activities: ActivityEvent[] = [
  {
    id: 'a-nexus-release',
    projectId: 'nexus',
    title: 'Релиз отложен на 3 дня',
    createdAt: new Date(now - 2 * HOUR).toISOString(),
    type: 'update',
  },
  {
    id: 'a-didi-partner',
    projectId: 'didi',
    title: 'Новый партнёр по маршруту',
    createdAt: new Date(now - 5 * HOUR).toISOString(),
    type: 'update',
  },
  {
    id: 'a-metan-feedback',
    projectId: 'metan',
    title: 'Ожидается обратная связь по финансированию',
    createdAt: new Date(now - 24 * HOUR).toISOString(),
    type: 'deadline',
  },
];
