import type { Project } from './types';

const HOUR = 3_600_000;
const now = Date.now();

/**
 * Scene coordinates live in the 1200×800 logical space of OrbitCanvas,
 * user core at (600, 400). Positions are mock — no physics engine in stage 1.
 */
export const projects: Project[] = [
  {
    id: 'nexus',
    title: 'Nexus',
    subtitle: 'B2B-платформа',
    shortCode: 'NX',
    icon: 'network',
    status: 'stable',
    statusLabel: 'Стабильно',
    position: { x: 300, y: 220 },
    size: 'lg',
    updatedAt: new Date(now - 2 * HOUR).toISOString(),
    summary:
      'Платформа работает стабильно. Релиз 2.4 сдвинут на 3 дня, команда закрывает регрессионные тесты.',
  },
  {
    id: 'metan',
    title: 'Metan',
    subtitle: 'Газовое оборудование',
    shortCode: 'MT',
    icon: 'flame',
    status: 'paused',
    statusLabel: 'На паузе',
    position: { x: 890, y: 175 },
    size: 'sm',
    updatedAt: new Date(now - 9 * 24 * HOUR).toISOString(),
    summary:
      'Проект приостановлен до ответа партнёра по финансированию. Обновлений не было 9 дней.',
  },
  {
    id: 'didi',
    title: 'Didi',
    subtitle: 'Логистика',
    shortCode: 'DD',
    icon: 'car',
    status: 'risk',
    statusLabel: 'Риск',
    position: { x: 975, y: 450 },
    size: 'md',
    updatedAt: new Date(now - 5 * HOUR).toISOString(),
    summary:
      'Срыв сроков поставки у ключевого подрядчика. Новый партнёр может закрыть маршрут, нужна проверка условий.',
  },
  {
    id: 'kofeynya',
    title: 'Кофейня',
    subtitle: 'Офлайн-точка',
    shortCode: 'КФ',
    icon: 'coffee',
    status: 'attention',
    statusLabel: 'Требует внимания',
    position: { x: 285, y: 560 },
    size: 'md',
    updatedAt: new Date(now - 26 * HOUR).toISOString(),
    summary:
      'Расходы выросли на 14% за месяц. Основной драйвер — закупка расходников, стоит проверить поставщика.',
  },
  {
    id: 'freelance',
    title: 'Фриланс',
    subtitle: 'Клиентские проекты',
    shortCode: 'ФР',
    icon: 'code',
    status: 'working',
    statusLabel: 'В работе',
    position: { x: 585, y: 135 },
    size: 'sm',
    updatedAt: new Date(now - 3 * HOUR).toISOString(),
    summary:
      'Два активных контракта. Клиент по интеграции ждёт оценку до конца недели.',
  },
  {
    id: 'invent-sale',
    title: 'invent.sale',
    subtitle: 'Пилот маркетплейса',
    shortCode: 'IS',
    icon: 'tag',
    status: 'decision',
    statusLabel: 'Требует решения',
    position: { x: 830, y: 630 },
    size: 'lg',
    updatedAt: new Date(now - 1 * HOUR).toISOString(),
    summary:
      'Партнёр предложил два формата пилота. Решение о формате открывает следующий этап и влияет на выручку квартала.',
  },
];

export const projectById = new Map(projects.map((p) => [p.id, p]));

/** Semantic accent color per project — derived from its current status. */
export const projectColorVar: Record<string, string> = {
  nexus: 'var(--color-state-stable)',
  metan: 'var(--color-state-paused)',
  didi: 'var(--color-state-risk)',
  kofeynya: 'var(--color-state-attention)',
  freelance: 'var(--color-state-working)',
  'invent-sale': 'var(--color-state-decision)',
};
