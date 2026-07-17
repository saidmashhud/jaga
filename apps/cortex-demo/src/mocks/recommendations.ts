import type { Recommendation } from './types';

export const recommendation: Recommendation = {
  id: 'r-invent-focus',
  title: 'Сфокусируйтесь на invent.sale',
  description:
    'Сейчас лучше сосредоточиться на invent.sale. Это принесёт наибольший эффект в ближайшие 7 дней.',
  reasons: [
    'Прямое влияние на выручку следующего квартала.',
    'Партнёр ждёт вашего решения по формату пилота.',
    'От решения зависят задачи логистики Didi.',
    'Временное окно закрывается в пятницу.',
  ],
  projectIds: ['invent-sale'],
};
