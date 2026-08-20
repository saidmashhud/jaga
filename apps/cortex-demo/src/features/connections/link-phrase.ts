import type { ConnectionKind } from '../../services/cortex-api';
import type { ProjectConnection } from '../../mocks/types';

/**
 * Правила формы связи, отделённые от разметки.
 *
 * Здесь живёт всё, в чём можно ошибиться молча: как читается фраза, считается
 * ли пара уже связанной, в каком порядке встают концы. Ошибка в любом из этих
 * мест не видна на экране — она видна только потом, кривой расстановкой узлов,
 * когда искать причину уже негде.
 */

/** Место, которое человек ещё не заполнил. Стоит в фразе бледным. */
export const BLANK_KIND = '— выберите вид —';
export const BLANK_TARGET = '— выберите второй проект —';

/**
 * Связь, прочитанная вслух.
 *
 * Это единственное объяснение направления в форме. Слова «направление» человек
 * не увидит: «Кофейня даёт деньги Фрилансу» понятно без него, а стрелка и
 * тире сами показывают, важен порядок или нет.
 */
export function phraseOf(
  kind: ConnectionKind | null,
  sourceTitle: string,
  targetTitle: string | null,
): { left: string; middle: string; right: string; directed: boolean } {
  return {
    left: sourceTitle,
    middle: kind ? kind.phrase : BLANK_KIND,
    right: targetTitle ?? BLANK_TARGET,
    directed: kind ? kind.directed : true,
  };
}

/**
 * Порядок концов в том виде, в каком его примет служба.
 *
 * У ненаправленных видов служба приводит концы к одному порядку, чтобы
 * зеркальный двойник не завёлся. Страница обязана показывать то же самое,
 * иначе человек нажмёт «Наоборот», ничего не изменится, и он решит, что
 * кнопка сломана.
 */
export function orderedEnds(
  kind: ConnectionKind | null,
  source: string,
  target: string,
): [string, string] {
  if (kind && !kind.directed && source > target) return [target, source];
  return [source, target];
}

/**
 * Уже связана ли эта пара — в любую сторону.
 *
 * Ищется по паре опознавателей, а не по собранному имени связи: имя
 * склеивается через дефис, а дефис встречается и внутри самих имён
 * («invent-sale»), и совпадение вышло бы ложным.
 */
export function findExisting(
  connections: ProjectConnection[],
  a: string,
  b: string,
): { link: ProjectConnection; reversed: boolean } | null {
  for (const c of connections) {
    if (c.sourceId === a && c.targetId === b) return { link: c, reversed: false };
    if (c.sourceId === b && c.targetId === a) return { link: c, reversed: true };
  }
  return null;
}

/** Порядок состояний по оси внимания: первое ближе всего к зрителю. */
const ATTENTION = ['decision', 'risk', 'attention', 'working', 'stable', 'paused'];

/**
 * Насколько далеко друг от друга проекты по оси внимания.
 *
 * Ось внимания — это глубина сцены, и связь на неё не влияет вовсе: глубину
 * задаёт только состояние проекта. Если проекты стоят на разных её этажах,
 * человека стоит предупредить — иначе он заведёт связь, ожидая, что она их
 * сведёт, и решит, что связь не сработала.
 */
export function attentionGap(a: string, b: string): number {
  const i = ATTENTION.indexOf(a);
  const j = ATTENTION.indexOf(b);
  if (i < 0 || j < 0) return 0;
  return Math.abs(i - j);
}

/** Чего не хватает, чтобы связь можно было завести. Пусто — можно. */
export function missing(target: string | null, kind: ConnectionKind | null): string | null {
  if (!target) return 'Выберите второй проект';
  if (!kind) return 'Выберите, что между ними';
  return null;
}
