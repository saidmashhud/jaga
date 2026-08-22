import { useEffect, useState } from 'react';
import { del, loadPending, postJSON, type LooseCapture } from '../../services/cortex-api';
import { dataSource, mockCortexService } from '../../services/mock-cortex-service';
import styles from './LooseNotes.module.css';

/**
 * Записи, до которых не дошли руки — ни ваши, ни модели.
 *
 * Раньше их было видно только числом: строка сообщала «без проекта: 3» и
 * никуда не вела. Это хуже, чем молчать: человек знает, что где-то лежат три
 * его мысли, и не может до них добраться. Написанное и не показанное потеряно
 * вернее, чем непринятое.
 *
 * Здесь запись можно прочесть целиком, отнести к делу или выбросить. Разбор
 * рукой идёт той же дорогой, что и разбор моделью: запись становится событием
 * на проекте. Иначе было бы два разных способа считаться разобранным.
 */
export function LooseNotes({ version, onChange }: { version: number; onChange: () => void }) {
  const [items, setItems] = useState<LooseCapture[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (dataSource() !== 'live') return;
    let alive = true;
    void loadPending().then((all) => {
      if (alive) setItems(all);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const projects = mockCortexService.getProjects();
  const busyItems = items.filter((c) => c.state === 'pending');
  const loose = items.filter((c) => c.state !== 'pending');

  async function assign(id: string, projectId: string, title: string) {
    setBusy(id);
    setErr(null);
    const r = await postJSON(`/v1/captures/${encodeURIComponent(id)}/assign`, {
      projectId,
      // Текст записи и есть название события: переписывать за человека то, что
      // он уже сформулировал, — лишний обряд.
      title: title.slice(0, 120),
    });
    setBusy(null);
    if (!r.ok && r.status !== 404) {
      setErr(r.error || 'Не удалось отнести запись');
      return;
    }
    setItems((all) => all.filter((c) => c.id !== id));
    onChange();
  }

  async function drop(id: string) {
    setBusy(id);
    setErr(null);
    const r = await del(`/v1/captures/${encodeURIComponent(id)}`);
    setBusy(null);
    if (!r.ok && r.status !== 404) {
      setErr(r.error || 'Не удалось выбросить запись');
      return;
    }
    setItems((all) => all.filter((c) => c.id !== id));
    onChange();
  }

  if (items.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.bar} role="status">
        {busyItems.length > 0 && (
          <span className={styles.busy}>
            Разбираем {busyItems.length === 1 ? 'запись' : `записей: ${busyItems.length}`}
          </span>
        )}
        {loose.length > 0 && (
          <button className={styles.open} type="button" onClick={() => setOpen((v) => !v)}>
            {open ? 'Скрыть' : `Без проекта: ${loose.length}`}
          </button>
        )}
      </div>

      {open && (
        <ul className={styles.list}>
          {loose.map((c) => (
            <li key={c.id} className={styles.item}>
              <p className={styles.text}>{c.text}</p>
              <div className={styles.actions}>
                <label className={styles.pick}>
                  <span className={styles.picked}>Отнести к делу</span>
                  <select
                    defaultValue=""
                    disabled={busy === c.id}
                    onChange={(e) => {
                      if (e.target.value) void assign(c.id, e.target.value, c.text);
                    }}
                  >
                    <option value="" disabled>
                      Выберите
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={styles.drop}
                  type="button"
                  disabled={busy === c.id}
                  onClick={() => void drop(c.id)}
                >
                  Выбросить
                </button>
                {c.state === 'failed' && (
                  <span className={styles.why}>модель не смогла разобрать</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
