import { useMemo } from 'react';
import { mockCortexService } from '../../services/mock-cortex-service';
import { useCortex } from '../../state/CortexProvider';
import styles from './SearchResults.module.css';

/**
 * Поиск по загруженному, а не по сети.
 *
 * Данных здесь десятки записей — они целиком лежат в памяти с загрузки. Идти
 * за ними в службу на каждую букву значило бы платить сетью за то, что и так
 * под рукой, и получать подсказки с опозданием.
 *
 * Раньше строка поиска отвечала тостом «появится на следующем этапе».
 */

type Hit =
  | { kind: 'project'; id: string; title: string; sub: string }
  | { kind: 'focus'; id: string; title: string; sub: string }
  | { kind: 'event'; id: string; title: string; sub: string };

const KIND: Record<Hit['kind'], string> = {
  project: 'Проект',
  focus: 'Задача',
  event: 'Событие',
};

/** Совпадение по началу слова, а не по любому месту строки.
 *
 * «ко» находит «Кофейню», но не «Смоко»: середина слова почти никогда не то,
 * что человек имел в виду, и подсказки из таких совпадений сбивают. */
function matches(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  return h.startsWith(n) || h.includes(' ' + n) || h.includes('.' + n);
}

export function SearchResults() {
  const { state, dispatch } = useCortex();
  const q = state.searchValue.trim();

  const hits = useMemo<Hit[]>(() => {
    if (q.length < 2) return [];
    const out: Hit[] = [];
    const byId = new Map(mockCortexService.getProjects().map((p) => [p.id, p.title]));

    for (const p of mockCortexService.getProjects()) {
      if (matches(p.title, q) || matches(p.subtitle, q) || matches(p.summary, q)) {
        out.push({ kind: 'project', id: p.id, title: p.title, sub: p.statusLabel });
      }
    }
    for (const f of mockCortexService.getFocusItems()) {
      if (matches(f.title, q) || matches(f.description ?? '', q)) {
        out.push({ kind: 'focus', id: f.id, title: f.title, sub: byId.get(f.projectId) ?? '' });
      }
    }
    for (const e of mockCortexService.getActivities()) {
      if (matches(e.title, q)) {
        out.push({ kind: 'event', id: e.id, title: e.title, sub: byId.get(e.projectId) ?? '' });
      }
    }
    // Больше десятка подсказок никто не читает — читают первые три.
    return out.slice(0, 12);
  }, [q]);

  if (q.length < 2) return null;

  return (
    <div className={styles.results} role="listbox" aria-label="Результаты поиска">
      {hits.length === 0 ? (
        <p className={styles.empty}>Ничего не нашлось по запросу «{q}»</p>
      ) : (
        hits.map((h) => (
          <button
            key={`${h.kind}-${h.id}`}
            role="option"
            aria-selected={false}
            className={styles.hit}
            onClick={() => {
              // Найденный проект выделяется на сцене — это и есть ответ на
              // «где он»; для задачи и события выделяется её проект.
              if (h.kind === 'project') dispatch({ type: 'select-project', id: h.id });
              dispatch({ type: 'set-search', value: '' });
            }}
          >
            <span className={styles.kind}>{KIND[h.kind]}</span>
            <span className={styles.text}>
              <b>{h.title}</b>
              {h.sub && <em>{h.sub}</em>}
            </span>
          </button>
        ))
      )}
    </div>
  );
}
