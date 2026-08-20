import { useState } from 'react';
import { mockCortexService } from '../../services/mock-cortex-service';
import { del } from '../../services/cortex-api';
import styles from './ProjectLinks.module.css';

/**
 * Связи выбранного проекта — со способом их убрать.
 *
 * Заводить, не имея чем убрать, — половина дела: связь определяет место всех
 * узлов, и ошибочная тихо перекашивает сцену, а найти причину потом почти
 * нечем. Список стоит там же, где заводится связь, чтобы «передумал» стоило
 * ровно столько же, сколько «завёл».
 */
export function ProjectLinks({ projectId, editable }: { projectId: string; editable: boolean }) {
  const links = mockCortexService.getConnections().filter(
    (c) => c.sourceId === projectId || c.targetId === projectId,
  );
  const [sure, setSure] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const titleOf = (id: string) => mockCortexService.getProject(id)?.title ?? id;

  async function remove(id: string) {
    setBusy(id);
    setErr(null);
    const r = await del(`/v1/connections/${encodeURIComponent(id)}`);
    setBusy(null);
    if (r.expired) {
      setErr('Сессия кончилась — войдите заново');
      return;
    }
    // Связи уже нет — это не отказ: её могли снять в другой вкладке. Сцену
    // всё равно надо переложить, чтобы экран перестал показывать снятое.
    if (!r.ok && r.status !== 404) {
      setErr(r.error || 'Не удалось убрать связь');
      return;
    }
    // Перезагрузка, а не догрузка: место узлов считает служба из всех связей
    // разом, и убрать одну линию на месте нельзя — переедут все.
    window.location.reload();
  }

  return (
    <div className={styles.root}>
      <p className={styles.head}>Связи</p>
      {links.length === 0 ? (
        <p className={styles.empty}>Пока ни с чем не связан.</p>
      ) : (
        links.map((c) => (
          <div key={c.id} className={styles.row}>
            <span className={styles.phrase}>
              {titleOf(c.sourceId)} <span className={styles.mid}>→</span> {titleOf(c.targetId)}
              <span className={styles.note}>{c.label || 'без подписи'}</span>
            </span>
            {editable &&
              (sure === c.id ? (
                <span>
                  <button
                    className={`${styles.act} ${styles.sure}`}
                    type="button"
                    disabled={busy === c.id}
                    onClick={() => remove(c.id)}
                  >
                    {busy === c.id ? 'Убираем' : 'Точно убрать'}
                  </button>{' '}
                  <button className={styles.act} type="button" onClick={() => setSure(null)}>
                    Отмена
                  </button>
                </span>
              ) : (
                <button className={styles.act} type="button" onClick={() => setSure(c.id)}>
                  Убрать
                </button>
              ))}
          </div>
        ))
      )}
      {err && (
        <p className={styles.empty} role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
