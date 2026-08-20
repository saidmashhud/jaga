import { useEffect } from 'react';
import { crowdedIds } from '@cortex/ui';

/**
 * Разведение налезающих имён на карте.
 *
 * Подписи стоят под своими узлами и друг о друге не знают ничего. Когда узлы
 * сходятся, имена налезают, и вместо двух читается ни одного. Гашение по
 * приближению снимает часть тесноты, но не всю: два соседних дела на одном
 * поясе стоят рядом на любом масштабе.
 *
 * Решение принимается по тому, что важнее: ближе к ядру — важнее. Уступивший
 * не исчезает, а ужимается и глушится: подпись, пропадающая при движении
 * сцены, читается как сбой.
 *
 * Меряется настоящее место на экране, поэтому это эффект, а не расчёт: до
 * отрисовки размеров ни у кого нет.
 */
export function useLabelTraffic(root: React.RefObject<HTMLElement>, deps: unknown[]): void {
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    let frame = 0;
    const settle = () => {
      const nodes = [...el.querySelectorAll<HTMLElement>('[data-node-id]')];
      // Подписи шкалы — в той же очереди. Иначе выходят две толпы: каждая
      // разведена внутри себя и слепа к другой, а налезают они как раз друг на
      // друга — кольца проходят ровно там, где стоят узлы.
      const marks = [...el.querySelectorAll<SVGTextElement>('[data-scale-label]')];
      if (nodes.length + marks.length < 2) return;

      // Сперва разжимаем всех и только потом мерим. Иначе уступившая подпись
      // мерилась бы уже ужатой, освобождала бы место, на следующем проходе
      // разворачивалась обратно — и так без конца, мигая.
      for (const n of nodes) n.dataset.crowded = 'no';
      for (const m of marks) m.removeAttribute('data-crowded');

      const items = [
        // Кружок узла — тоже препятствие для подписи шкалы. Слово, попавшее
        // под кружок, не читается ровно так же, как попавшее под другое слово;
        // без этого «ТРЕБУЕТ РЕШЕНИЯ» пряталось за узлом, который на этом
        // кольце и стоит.
        ...nodes.map((n, i) => {
          const r = n.getBoundingClientRect();
          return {
            id: `круг:${n.dataset.nodeId ?? i}`,
            rank: 1000 - Number(n.dataset.belt ?? 4) * 100,
            box: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
          };
        }),
        ...nodes.map((n, i) => {
          const meta = n.querySelector<HTMLElement>('[data-node-meta]') ?? n;
          const r = meta.getBoundingClientRect();
          return {
            id: `узел:${n.dataset.nodeId ?? i}`,
            // Ближе к ядру — важнее. Тот же порядок, что задаёт вся карта:
            // двух разных мнений о важности на сцене быть не должно.
            rank: 1000 - Number(n.dataset.belt ?? 4) * 100,
            box: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
          };
        }),
        ...marks.map((m, i) => {
          const r = m.getBoundingClientRect();
          // Шкала — фон, по которому читаются имена: уступает всегда.
          return {
            id: `шкала:${i}`,
            rank: -1000 + i,
            box: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
          };
        }),
      ];

      const crowded = crowdedIds(items);
      for (const n of nodes) {
        if (crowded.has(`узел:${n.dataset.nodeId ?? ''}`)) n.dataset.crowded = 'yes';
      }
      marks.forEach((m, i) => {
        if (crowded.has(`шкала:${i}`)) m.setAttribute('data-crowded', 'yes');
      });
    };

    // Через кадр: на момент эффекта разметка ещё не разложена, и все
    // прямоугольники нулевые.
    frame = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
