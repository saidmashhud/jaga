import type { FocusItem } from './types';

export const focusItems: FocusItem[] = [
  {
    id: 'f-invent-pilot',
    projectId: 'invent-sale',
    title: 'Утвердить формат пилота',
    description: 'Партнёр ждёт ответ до пятницы. Решение открывает следующий этап.',
    impact: 'high',
    completed: false,
  },
  {
    id: 'f-kofeynya-costs',
    projectId: 'kofeynya',
    title: 'Расходы выросли на 14%',
    description: 'Разобрать закупки за месяц и переговорить с поставщиком.',
    impact: 'medium',
    completed: false,
    progress: 30,
  },
  {
    id: 'f-freelance-estimate',
    projectId: 'freelance',
    title: 'Клиент ожидает оценку',
    description: 'Подготовить оценку по интеграции до конца недели.',
    impact: 'medium',
    completed: false,
    progress: 60,
  },
];
