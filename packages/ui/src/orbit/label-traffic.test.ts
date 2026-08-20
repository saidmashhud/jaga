import { describe, expect, it } from 'vitest';
import { crowdedIds, type Box } from './label-traffic';

/** Подпись шириной 100 и высотой 30 в заданной точке. */
function at(left: number, top: number, w = 100, h = 30): Box {
  return { left, right: left + w, top, bottom: top + h };
}

describe('разведение подписей', () => {
  it('когда никто ни на кого не налезает, уступать некому', () => {
    const got = crowdedIds([
      { id: 'a', rank: 1, box: at(0, 0) },
      { id: 'b', rank: 2, box: at(400, 0) },
      { id: 'c', rank: 3, box: at(0, 300) },
    ]);
    expect(got.size).toBe(0);
  });

  it('уступает менее важный по оси внимания, а не тот, что позже в списке', () => {
    // «а» идёт первым, но «б» важнее — значит ужаться должен «а».
    const got = crowdedIds([
      { id: 'a', rank: 1, box: at(10, 10) },
      { id: 'b', rank: 5, box: at(20, 12) },
    ]);
    expect([...got]).toEqual(['a']);
  });

  it('уступивший не освобождает место третьей подписи', () => {
    // Три подписи в одной точке. Останется одна — самая важная. Если бы
    // уступивший считался исчезнувшим, на его место встал бы следующий, и
    // видимых оказалось бы две поверх друг друга.
    const got = crowdedIds([
      { id: 'сильный', rank: 9, box: at(0, 0) },
      { id: 'средний', rank: 5, box: at(4, 2) },
      { id: 'слабый', rank: 1, box: at(8, 4) },
    ]);
    expect(got).toEqual(new Set(['средний', 'слабый']));
  });

  it('касание боками впритык считается теснотой', () => {
    // Между подписями обязателен зазор: вплотную поставленные имена
    // читаются как одно слово.
    const got = crowdedIds([
      { id: 'a', rank: 2, box: at(0, 0) },
      { id: 'b', rank: 1, box: at(102, 0) },
    ]);
    expect([...got]).toEqual(['b']);
    const roomy = crowdedIds([
      { id: 'a', rank: 2, box: at(0, 0) },
      { id: 'b', rank: 1, box: at(120, 0) },
    ]);
    expect(roomy.size).toBe(0);
  });

  it('при равной важности решение одно и то же, а не пляшет от кадра к кадру', () => {
    const items = [
      { id: 'вторая', rank: 3, box: at(0, 0) },
      { id: 'первая', rank: 3, box: at(5, 0) },
    ];
    const a = crowdedIds(items);
    const b = crowdedIds(items.slice().reverse());
    expect([...a]).toEqual([...b]);
  });

  it('связь уступает узлу, даже когда лежит ближе к зрителю', () => {
    // Так считается вес в разводящем: узел получает надбавку, которую не
    // перебить никакой глубиной. Связь без своих узлов не значит ничего, а
    // узел читается сам по себе.
    const узел = 1e6 + -5 * 1000;
    const связь = 0 + 5 * 1000;
    const got = crowdedIds([
      { id: 'связь', rank: связь, box: at(0, 0) },
      { id: 'узел', rank: узел, box: at(6, 3) },
    ]);
    expect([...got]).toEqual(['связь']);
  });

  it('пустая сцена не ломает разводку', () => {
    expect(crowdedIds([]).size).toBe(0);
  });
});
