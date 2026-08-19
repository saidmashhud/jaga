import { useState } from 'react';
import styles from './NewProject.module.css';

/**
 * Заведение проекта.
 *
 * Скелет пространства человек строит руками, а поток отдаёт модели. Завести
 * проект — поступок: вы решаете, что это отдельное дело вашей жизни, и такое
 * заслуживает формы с полями, а не догадки медленной модели. Запись в
 * композер — рутина, и вот её берёт она.
 *
 * Координат здесь нет намеренно: их считает раскладка из связей и состояния.
 * Просить человека поставить проект на сцене значило бы вернуть ту ручную
 * расстановку, от которой мы ушли.
 */

/** Состояния в порядке оси внимания: сверху то, что ближе к зрителю. */
const STATES: Array<{ id: string; label: string; hint: string }> = [
  { id: 'decision', label: 'Требует решения', hint: 'ждёт вас, без ответа не двинется' },
  { id: 'risk', label: 'Риск', hint: 'что-то идёт не так' },
  { id: 'attention', label: 'Требует внимания', hint: 'пора посмотреть' },
  { id: 'working', label: 'В работе', hint: 'идёт своим ходом' },
  { id: 'stable', label: 'Стабильно', hint: 'не требует ничего' },
  { id: 'paused', label: 'На паузе', hint: 'отложено' },
];

export function NewProject({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState('working');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle, summary, status }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d.error ?? 'Не удалось завести проект');
        return;
      }
      onDone();
    } catch {
      setErr('Нет связи со службой');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.title}>Новый проект</h2>

      <label className={styles.field}>
        <span className={styles.label}>Название</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Кофейня на Рудаки"
          autoFocus
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Что это</span>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Офлайн-точка"
        />
      </label>

      <fieldset className={styles.states}>
        <legend className={styles.label}>Состояние</legend>
        {/* Состояние — не украшение: от него зависит, насколько близко к
            зрителю встанет проект на сцене. Поэтому у каждого варианта
            написано, что он значит, а не только как называется. */}
        {STATES.map((s) => (
          <label key={s.id} className={status === s.id ? styles.stateOn : styles.state}>
            <input
              type="radio"
              name="status"
              value={s.id}
              checked={status === s.id}
              onChange={() => setStatus(s.id)}
            />
            <span>
              <b>{s.label}</b>
              <em>{s.hint}</em>
            </span>
          </label>
        ))}
      </fieldset>

      <label className={styles.field}>
        <span className={styles.label}>Своими словами</span>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Что здесь происходит и чего вы от него ждёте"
          rows={3}
        />
      </label>

      {err && (
        <p className={styles.err} role="alert">
          {err}
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.submit} type="submit" disabled={busy || !title.trim()}>
          {busy ? 'Заводим' : 'Завести'}
        </button>
        <button className={styles.cancel} type="button" onClick={onCancel}>
          Отмена
        </button>
      </div>

      <p className={styles.foot}>
        Место на сцене считается само — из состояния и связей. Связать проекты
        можно после того, как их станет двое.
      </p>
    </form>
  );
}
