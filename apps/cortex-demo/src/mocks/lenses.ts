import type { Lens } from './types';

export const lenses: Lens[] = [
  {
    id: 'l-decisions',
    title: 'Где нужны мои решения?',
    type: 'decisions',
    projectIds: ['invent-sale'],
    explanation: 'Подсвечены проекты, где решение за вами.',
  },
  {
    id: 'l-risks',
    title: 'Покажи риски',
    type: 'risks',
    projectIds: ['didi', 'kofeynya'],
    explanation: 'Подсвечены проекты с риском или требующие внимания.',
  },
  {
    id: 'l-money',
    title: 'Что влияет на деньги?',
    type: 'money',
    projectIds: ['kofeynya', 'freelance', 'invent-sale'],
    explanation: 'Подсвечены проекты с прямым влиянием на денежный поток.',
  },
  {
    id: 'l-stale',
    title: 'Проекты без обновлений',
    type: 'stale',
    projectIds: ['metan'],
    explanation: 'Подсвечены проекты без обновлений больше недели.',
  },
];
