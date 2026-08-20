import { describe, expect, it } from 'vitest';
import type { Project, ProjectConnection } from '../../mocks/types';
import { angleOf, inBeltOrder, labelsVisible, linkCounts, sizeByLinks } from './belts';

const C = { x: 600, y: 400 };

function проект(id: string, belt: number, x: number, y: number): Project {
  return {
    id, title: id, subtitle: '', status: 'working', statusLabel: 'В работе',
    position: { x, y, z: 0 }, belt, size: 'md', updatedAt: '', summary: '',
  } as Project;
}

describe('порядок обхода', () => {
  it('сперва пояса ближе к ядру', () => {
    // Первое, на что попадает Tab, — то, что требует решения. Сейчас порядок
    // задаёт свежесть, и маршрут перетасовывается после каждого обновления.
    const list = [проект('дальний', 6, 600, 740), проект('ближний', 1, 600, 288)];
    expect(inBeltOrder(list, C).map((p) => p.id)).toEqual(['ближний', 'дальний']);
  });

  it('внутри пояса — по часовой стрелке от двенадцати', () => {
    const сверху = проект('сверху', 4, 600, 146);
    const справа = проект('справа', 4, 854, 400);
    const снизу = проект('снизу', 4, 600, 654);
    expect(inBeltOrder([снизу, справа, сверху], C).map((p) => p.id)).toEqual([
      'сверху', 'справа', 'снизу',
    ]);
  });

  it('одинаковый угол разводится именем — порядок не пляшет', () => {
    const a = проект('a', 4, 854, 400);
    const b = проект('b', 4, 854, 400);
    expect(inBeltOrder([b, a], C).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('угол считается от двенадцати часов', () => {
    expect(angleOf(проект('в', 4, 600, 146), C)).toBeCloseTo(0, 6);
    expect(angleOf(проект('в', 4, 854, 400), C)).toBeCloseTo(Math.PI / 2, 6);
  });
});

describe('размер по связям', () => {
  it('растёт ступенями и не выше крупного', () => {
    expect(sizeByLinks(0)).toBe('sm');
    expect(sizeByLinks(1)).toBe('sm');
    expect(sizeByLinks(2)).toBe('md');
    expect(sizeByLinks(3)).toBe('md');
    expect(sizeByLinks(4)).toBe('lg');
    expect(sizeByLinks(40)).toBe('lg');
  });

  it('считает оба конца связи', () => {
    const cs = [
      { id: '1', sourceId: 'a', targetId: 'b', type: 'team', strength: 1 },
      { id: '2', sourceId: 'a', targetId: 'c', type: 'team', strength: 1 },
    ] as ProjectConnection[];
    const n = linkCounts(cs);
    expect(n.get('a')).toBe(2);
    expect(n.get('b')).toBe(1);
    expect(n.get('c')).toBe(1);
    expect(n.get('нет-такого')).toBeUndefined();
  });
});

describe('видимость подписей', () => {
  it('по умолчанию названы все', () => {
    // Порог отсчитывается от ручного приближения. Пока он считался от
    // вписывающего масштаба, внешние имена не показывались НИ РАЗУ: на обычном
    // окне сцена вписывается в 0.8, и порог 0.85 не брался никогда.
    expect(labelsVisible(1, 1)).toBe(true);
    expect(labelsVisible(1, 6)).toBe(true);
  });

  it('при отдалении край замолкает, середина говорит', () => {
    expect(labelsVisible(0.6, 6)).toBe(false);
    expect(labelsVisible(0.6, 3)).toBe(true);
  });

  it('внутри черты решения имя не гаснет никогда', () => {
    expect(labelsVisible(0.5, 1)).toBe(true);
    expect(labelsVisible(0.5, 2)).toBe(true);
    expect(labelsVisible(0.5, 3)).toBe(true);
  });
});
