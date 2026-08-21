import { useState } from 'react';
import { del } from '../../services/cortex-api';
import styles from './RemoveProject.module.css';

/**
 * Убрать проект.
 *
 * Заводить, не имея чем убрать, — половина дела. Проект заводится в один жест,
 * в том числе по ошибке или на пробу, и без этого он остаётся в пространстве
 * навсегда: лишний узел на карте, лишний счёт на кольце, чужая строка в
 * списке. Связи уходят следом — связь с исчезнувшим концом ничего не выражает.
 *
 * Спрашиваем подтверждение: это единственное здесь действие, которого не
 * отменить, и вместе с проектом уходят все его связи.
 */
export function RemoveProject({ id, title, links }: { id: string; title: string; links: number }) {
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setErr(null);
    const r = await del(`/v1/projects/${encodeURIComponent(id)}`);
    setBusy(false);
    if (r.expired) {
      setErr('Сессия кончилась — войдите заново');
      return;
    }
    // 404 — проект уже убрали в другой вкладке. Это не отказ, но сцену всё
    // равно надо переложить: она показывает то, чего нет.
    if (!r.ok && r.status !== 404) {
      setErr(r.error || 'Не удалось убрать проект');
      return;
    }
    // Перезагрузка, а не догрузка: место узлов считает служба из всех связей
    // разом, и убрать один узел на месте нельзя — переедут все.
    window.location.reload();
  }

  if (!sure) {
    return (
      <button className={styles.act} type="button" onClick={() => setSure(true)}>
        Убрать проект
      </button>
    );
  }

  return (
    <div className={styles.sure}>
      <span>
        Убрать «{title}» насовсем?
        {links > 0 && ` Вместе с ним уйдут связи: ${links}.`}
      </span>
      <span className={styles.row}>
        <button className={styles.danger} type="button" disabled={busy} onClick={remove}>
          {busy ? 'Убираем' : 'Убрать'}
        </button>
        <button className={styles.act} type="button" onClick={() => setSure(false)}>
          Отмена
        </button>
      </span>
      {err && (
        <span className={styles.err} role="alert">
          {err}
        </span>
      )}
    </div>
  );
}
