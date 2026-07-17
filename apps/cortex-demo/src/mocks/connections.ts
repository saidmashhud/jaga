import type { ProjectConnection } from './types';

export const connections: ProjectConnection[] = [
  {
    id: 'c-nexus-freelance',
    sourceId: 'nexus',
    targetId: 'freelance',
    label: 'используют одну команду',
    type: 'team',
    strength: 2,
  },
  {
    id: 'c-freelance-kofeynya',
    sourceId: 'freelance',
    targetId: 'kofeynya',
    label: 'даёт деньги в оборот',
    type: 'finance',
    strength: 2,
  },
  {
    id: 'c-metan-nexus',
    sourceId: 'metan',
    targetId: 'nexus',
    label: 'зависит от финансирования',
    // сдвиг подписи к Metan, чтобы не пересекаться с узлом «Фриланс»
    labelT: 0.25,
    type: 'dependency',
    strength: 1,
  },
  {
    id: 'c-invent-didi',
    sourceId: 'invent-sale',
    targetId: 'didi',
    label: 'клиент ждёт решение',
    type: 'client',
    strength: 3,
    animated: true,
  },
  {
    id: 'c-kofeynya-invent',
    sourceId: 'kofeynya',
    targetId: 'invent-sale',
    label: 'общий поставщик упаковки',
    type: 'resource',
    strength: 1,
  },
];
