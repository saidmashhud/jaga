import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { NodePositionStore } from './node-positions';
import { nodeVector } from './node-positions';

/**
 * Разведение подписей узлов.
 *
 * Подписи — настоящий DOM поверх канваса, и друг о друге они не знают ничего:
 * каждая рисуется там, где оказался её узел. При сближении узлов надписи
 * налезали друг на друга, и вместо двух имён получалась каша, в которой не
 * прочитать ни одного.
 *
 * Правило простое: когда две подписи сталкиваются, остаётся та, что важнее
 * по оси внимания. Это та же ось, по которой узлы расставлены в глубину, —
 * значит на сцене нет двух разных представлений о важности.
 *
 * Прятать целиком нельзя: исчезающая при повороте камеры подпись читается
 * как сбой. Поэтому уступившая ужимается до имени и глушится — она остаётся
 * на месте и возвращается, как только место освободилось.
 */

export interface LabelEntry {
  /** Ссылка на подпись, а не сам элемент.
   *
   *  drei рисует подпись отдельным корнем React из своего слоя, и на момент
   *  регистрации она может быть ещё не создана. Снимок `el` в этот миг был бы
   *  пустым навсегда — узел молча выпал бы из разводки. Ссылку же достаточно
   *  прочитать в кадре, когда всё уже на месте. */
  ref: { current: HTMLElement | null };
  /** Глубина по оси внимания: чем больше, тем важнее. */
  z: number;
}

export type LabelRegistry = Map<string, LabelEntry>;

/** Насколько часто пересчитывать. Двенадцать раз в секунду: глазу довольно,
 *  а измерение положения DOM стоит дорого и на каждом кадре расточительно. */
const EVERY = 1 / 12;

/** Прямоугольник подписи на экране. Своего типа хватает: DOMRect в тесте не
 *  создать без браузера, а нужны отсюда только четыре числа. */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function overlaps(a: Box, b: Box, pad = 4): boolean {
  return !(
    a.right + pad < b.left ||
    b.right + pad < a.left ||
    a.bottom + pad < b.top ||
    b.bottom + pad < a.top
  );
}

/**
 * Кто уступает.
 *
 * Сюда приходят уже измеренные подписи; решение — чистое, поэтому его можно
 * проверить тестом, не поднимая сцену. Порядок: сперва важные по оси
 * внимания, они занимают место; остальные, наткнувшись на занятое, уступают.
 *
 * Уступивший НЕ освобождает место для следующих за ним: он не исчезает, а
 * ужимается и остаётся там же. Считать его отсутствующим значило бы пустить
 * на его место третью подпись — и получить ровно ту кашу, от которой уходим.
 */
export function crowdedIds(
  items: Array<{ id: string; rank: number; box: Box }>,
): Set<string> {
  const order = items.slice().sort((a, b) => b.rank - a.rank || (a.id < b.id ? -1 : 1));
  const crowded = new Set<string>();
  const taken: Box[] = [];
  for (const it of order) {
    if (taken.some((t) => overlaps(t, it.box))) crowded.add(it.id);
    else taken.push(it.box);
  }
  return crowded;
}

export function LabelTraffic({
  registry,
  store,
}: {
  registry: LabelRegistry;
  store: NodePositionStore;
}) {
  const camera = useThree((s) => s.camera);
  const since = useRef(0);
  const probe = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    since.current += delta;
    if (since.current < EVERY) return;
    since.current = 0;

    // Порядок разбора: сперва то, что ближе к зрителю по оси внимания, при
    // равенстве — то, что ближе к камере. Первые занимают место, остальные
    // уступают. Так решение о том, чью подпись показать, повторяет решение
    // о том, что важно, — а не спорит с ним.
    const live: Array<{ id: string; el: HTMLElement; rank: number }> = [];
    registry.forEach((entry, id) => {
      const el = entry.ref.current;
      if (!el) return;
      probe.current.copy(nodeVector(store, id)).project(camera);
      // За спиной камеры — не показываем вовсе: подпись там всё равно не
      // соответствует ничему видимому.
      if (probe.current.z > 1) {
        el.dataset.crowded = 'hidden';
        return;
      }
      live.push({ id, el, rank: entry.z * 1000 - probe.current.z });
    });

    // Сперва разжимаем всех и только потом мерим. Иначе уступившая подпись
    // мерилась бы уже ужатой, освобождала бы место, на следующем проходе
    // разворачивалась обратно — и так без конца, мигая.
    for (const it of live) it.el.dataset.crowded = 'no';
    const measured = live.map((it) => {
      const r = it.el.getBoundingClientRect();
      return { id: it.id, rank: it.rank, box: { left: r.left, right: r.right, top: r.top, bottom: r.bottom } };
    });

    const crowded = crowdedIds(measured);
    for (const it of live) {
      if (crowded.has(it.id)) it.el.dataset.crowded = 'yes';
    }
  });

  return null;
}
