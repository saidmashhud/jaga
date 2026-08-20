import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, MIN_ZOOM, RESET, clampZoom, wheelFactor, zoomAt } from './view';

describe('приближение к курсору', () => {
  /** Куда уедет точка сцены после изменения вида. */
  function screenOf(view: { zoom: number; x: number; y: number }, sx: number, sy: number) {
    return { x: sx * view.zoom + view.x, y: sy * view.zoom + view.y };
  }

  it('точка под курсором остаётся под курсором', () => {
    // Ради этого всё и считается: иначе колесо увеличивает и одновременно
    // уносит из-под курсора то, на что человек смотрел.
    const view = { zoom: 1, x: 0, y: 0 };
    const cursor = { x: 137, y: -64 };
    // Точка сцены, оказавшаяся под курсором сейчас.
    const scene = { x: (cursor.x - view.x) / view.zoom, y: (cursor.y - view.y) / view.zoom };

    const next = zoomAt(view, 1.5, cursor.x, cursor.y);
    const after = screenOf(next, scene.x, scene.y);

    expect(after.x).toBeCloseTo(cursor.x, 6);
    expect(after.y).toBeCloseTo(cursor.y, 6);
  });

  it('работает и от уже сдвинутого состояния', () => {
    const view = { zoom: 1.7, x: -220, y: 95 };
    const cursor = { x: -40, y: 210 };
    const scene = { x: (cursor.x - view.x) / view.zoom, y: (cursor.y - view.y) / view.zoom };

    const next = zoomAt(view, 0.6, cursor.x, cursor.y);
    const after = screenOf(next, scene.x, scene.y);

    expect(after.x).toBeCloseTo(cursor.x, 6);
    expect(after.y).toBeCloseTo(cursor.y, 6);
  });

  it('на пределе колесо не возит сцену вбок', () => {
    const at = { zoom: MAX_ZOOM, x: 10, y: 20 };
    expect(zoomAt(at, 2, 300, 300)).toEqual(at);
    const low = { zoom: MIN_ZOOM, x: 10, y: 20 };
    expect(zoomAt(low, 0.5, 300, 300)).toEqual(low);
  });

  it('приближение не выходит за пределы', () => {
    expect(clampZoom(99)).toBe(MAX_ZOOM);
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(clampZoom(1.3)).toBe(1.3);
  });
});

describe('колесо', () => {
  it('вверх приближает, вниз отдаляет', () => {
    expect(wheelFactor(-100)).toBeGreaterThan(1);
    expect(wheelFactor(100)).toBeLessThan(1);
    expect(wheelFactor(0)).toBe(1);
  });

  it('огромный шаг не швыряет сцену через весь диапазон', () => {
    // «Мышь с ускорением» изредка выдаёт разом сотни единиц.
    const wild = wheelFactor(-4000);
    expect(wild).toBeLessThan(1.3);
    expect(wild).toBe(wheelFactor(-120));
  });

  it('исходный вид — единица без сдвига', () => {
    expect(RESET).toEqual({ zoom: 1, x: 0, y: 0 });
  });
});
