import { useEffect, useState } from 'react';
import { loadPending } from '../../services/cortex-api';
import { dataSource } from '../../services/mock-cortex-service';
import styles from './Pending.module.css';

/**
 * Записи, которые служба приняла, но ещё не разобрала.
 *
 * Между «отправил» и «появилось» проходят минуты: модель читает запись, решает,
 * к какому делу она относится, и только потом запись становится событием. Всё
 * это время на экране не менялось ничего — подтверждение гасло, и человек
 * решал, что не отправилось. Он писал второй раз и получал два одинаковых дела
 * вместо одного; в базе такие пары и лежат.
 *
 * Поэтому строка стоит прямо над композером, там же, где он писал. Она молчит,
 * когда разбирать нечего.
 */
export function Pending({ version }: { version: number }) {
  const [items, setItems] = useState<Array<{ id: string; text: string; state: string }>>([]);

  useEffect(() => {
    if (dataSource() !== 'live') return;
    let alive = true;
    void loadPending().then((all) => {
      if (!alive) return;
      // 'kept' — модель честно не отнесла запись ни к одному делу, 'failed' —
      // не смогла разобрать. И то и другое человек обязан видеть: запись,
      // легшая в базу и не показанная нигде, потеряна вернее, чем если бы её
      // не приняли вовсе.
      setItems(all.filter((c) => c.state === 'pending' || c.state === 'kept' || c.state === 'failed'));
    });
    return () => {
      alive = false;
    };
  }, [version]);

  if (items.length === 0) return null;

  const busy = items.filter((c) => c.state === 'pending');
  const loose = items.filter((c) => c.state !== 'pending');

  return (
    <div className={styles.root} role="status">
      {busy.length > 0 && (
        <span className={styles.busy}>
          Разбираем {busy.length === 1 ? 'запись' : `записей: ${busy.length}`} — «
          {busy[0].text.slice(0, 60)}
          {busy[0].text.length > 60 ? '…' : ''}»
        </span>
      )}
      {loose.length > 0 && (
        <span className={styles.loose}>
          Без проекта: {loose.length}. Их видно, но на карте им пока негде встать.
        </span>
      )}
    </div>
  );
}
