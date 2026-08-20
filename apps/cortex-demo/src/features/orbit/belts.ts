import type { Project, ProjectConnection } from '../../mocks/types';

/**
 * Устройство сцены: пояса внимания.
 *
 * Все числа приходят от службы — той же, что расставляет узлы. Своя таблица
 * радиусов на странице разошлась бы с серверной при первом же новом состоянии,
 * и узел рисовался бы не на своём кольце. Так уже случилось с цветами связей:
 * два словаря, один тип, разные цвета в двух сценах.
 */
export interface Belt {
  status: string;
  index: number;
  radius: number;
  band: number;
}

export interface SceneShape {
  width: number;
  height: number;
  center: { x: number; y: number };
  decisionRadius: number;
  belts: Belt[];
}

/** Русские имена поясов. Читаются и на кольце, и в имени узла для читалки. */
export const BELT_NAME: Record<string, string> = {
  decision: 'Требует решения',
  risk: 'Риск',
  attention: 'Требует внимания',
  working: 'В работе',
  stable: 'Стабильно',
  paused: 'На паузе',
};

/**
 * Порядок обхода — по поясам, а не по свежести.
 *
 * Служба отдаёт проекты `ORDER BY updated_at DESC`, и порядок в дереве
 * перетасовывался после каждого обновления данных: маршрут Tab менялся под
 * человеком сам собой. Здесь он привязан к картинке — сперва то, что требует
 * решения, дальше по часовой стрелке внутри пояса.
 */
export function inBeltOrder(projects: Project[], centre: { x: number; y: number }): Project[] {
  return projects.slice().sort((a, b) => {
    const belt = (a.belt ?? 4) - (b.belt ?? 4);
    if (belt !== 0) return belt;
    const angle = angleOf(a, centre) - angleOf(b, centre);
    if (Math.abs(angle) > 1e-9) return angle;
    return a.id < b.id ? -1 : 1;
  });
}

/** Угол от двенадцати часов по часовой стрелке. У экрана y растёт вниз. */
export function angleOf(p: Project, centre: { x: number; y: number }): number {
  const a = Math.atan2(p.position.y - centre.y, p.position.x - centre.x) + Math.PI / 2;
  return (a + 2 * Math.PI) % (2 * Math.PI);
}

/**
 * Размер узла — по числу связей.
 *
 * Радиус занят вниманием, цвет занят состоянием; размер свободен и показывает
 * то, что в данных уже есть. Рост сжатый намеренно: узел со многими связями
 * заметно крупнее одиночки, но не заслоняет карту.
 */
export function sizeByLinks(count: number): 'sm' | 'md' | 'lg' {
  if (count >= 4) return 'lg';
  if (count >= 2) return 'md';
  return 'sm';
}

/** Сколько связей у каждого проекта. */
export function linkCounts(connections: ProjectConnection[]): Map<string, number> {
  const out = new Map<string, number>();
  const bump = (id: string) => out.set(id, (out.get(id) ?? 0) + 1);
  for (const c of connections) {
    bump(c.sourceId);
    bump(c.targetId);
  }
  return out;
}

/**
 * Порог видимости подписей.
 *
 * Считается от РУЧНОГО приближения, а не от того, во сколько сцена вписалась в
 * окно: вписывающий масштаб зависит от высоты окна и на обычном экране равен
 * 0.8, так что порог по нему прятал внешние имена всегда, ни разу их не
 * показав.
 *
 * По умолчанию (приближение 1) названы все. Имена гаснут, когда человек
 * отдаляется, чтобы охватить целое: там читаются форма и плотность, а не
 * слова. Внутри черты решения имя не гаснет никогда — край может молчать,
 * середина говорит всегда.
 */
export function labelsVisible(zoom: number, belt: number): boolean {
  if (belt <= 3) return true;
  return zoom >= 0.85;
}
