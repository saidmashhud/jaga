import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { fit } from './FitCamera';

/** Камера сцены: тот же угол обзора, что в бою. */
function camera(aspect: number): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(34, aspect, 1, 60);
}
/** Пределы приближения в исходном виде — подобранные под шесть авторских координат. */
function controls() {
  return { minDistance: 11, maxDistance: 34 };
}

/** Какую долю высоты кадра занимает сцена с такого расстояния. */
function fill(radius: number, dist: number, cam: THREE.PerspectiveCamera): number {
  const visible = 2 * dist * Math.tan(((cam.fov * Math.PI) / 180) / 2);
  return (2 * radius) / visible;
}

describe('подгон кадра', () => {
  it('сцена занимает почти весь кадр, а не четверть', () => {
    const cam = camera(16 / 9);
    const d = fit(5, cam, { width: 1600, height: 900 }, controls());
    // Ради этого всё и затевалось: замер на живой сцене давал 0.25.
    expect(fill(5, d, cam)).toBeGreaterThan(0.8);
    expect(fill(5, d, cam)).toBeLessThan(1);
  });

  it('на узком экране решает горизонталь, и камера отходит дальше', () => {
    const wide = camera(16 / 9);
    const narrow = camera(3 / 4);
    const dWide = fit(5, wide, { width: 1600, height: 900 }, controls());
    const dNarrow = fit(5, narrow, { width: 600, height: 800 }, controls());
    expect(dNarrow).toBeGreaterThan(dWide);
  });

  it('пределы приближения раздвигаются под сцену, а не режут её', () => {
    // Два узла рядом: нужная дистанция меньше прежнего минимума в 11.
    const cam = camera(16 / 9);
    const c = controls();
    const d = fit(2.5, cam, { width: 1600, height: 900 }, c);
    expect(d).toBeLessThan(11);
    expect(c.minDistance).toBeLessThanOrEqual(d);
  });

  it('большая раскладка не упирается в прежний потолок', () => {
    const cam = camera(16 / 9);
    const c = controls();
    const d = fit(40, cam, { width: 1600, height: 900 }, c);
    expect(d).toBeGreaterThan(34);
    expect(c.maxDistance).toBeGreaterThanOrEqual(d);
  });

  it('вдвое больший размах — вдвое дальше камера', () => {
    const cam = camera(16 / 9);
    const a = fit(4, cam, { width: 1600, height: 900 }, controls());
    const b = fit(8, cam, { width: 1600, height: 900 }, controls());
    expect(b / a).toBeCloseTo(2, 5);
  });
});
