import { useState } from 'react';
import styles from './SignIn.module.css';

/**
 * Вход.
 *
 * Его не было вовсе: любой, кто знал адрес, видел чужие проекты, задачи и
 * записи целиком. Пока арендатор один, это выглядело безобидно — но именно
 * так и выглядит утечка до того, как случится.
 *
 * Экран сделан как титульная страница прибора, а не как форма в модальном
 * окне: это первое, что человек видит, и оно должно сказать, куда он попал.
 */

export function SignIn({ onDone }: { onDone: () => void }) {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/v1/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim() }),
      });
      if (!r.ok) {
        // Причина названа одна на все случаи: разный ответ на «нет такого
        // ключа» и «ключ отозван» превратил бы форму в способ их перебирать.
        setErr('Ключ не подошёл');
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
    <div className={styles.root}>
      {/* Сетка на фоне — не украшение: это та же координатная сетка, по
          которой раскладывается сцена, и вход стоит на ней же. */}
      <div className={styles.grid} aria-hidden="true" />

      <main className={styles.panel}>
        <div className={styles.mark}>
          <span className={styles.dot} aria-hidden="true" />
          <span>
            <b>Cortex</b>
            <em>Attention OS</em>
          </span>
        </div>

        <h1 className={styles.title}>
          Инструмент,
          <br />
          который держит
          <br />
          внимание
        </h1>

        <p className={styles.lede}>
          Показывает, какие проекты требуют решения, где риск и что изменилось,
          пока вас не было.
        </p>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            <span className={styles.label}>Ключ доступа</span>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              spellCheck={false}
              autoFocus
            />
          </label>

          {err && (
            <p className={styles.err} role="alert">
              {err}
            </p>
          )}

          <button className={styles.submit} type="submit" disabled={busy || !key.trim()}>
            {busy ? 'Проверяем' : 'Войти'}
            <span className={styles.arrow} aria-hidden="true" />
          </button>
        </form>

        <p className={styles.foot}>
          Ключ выдаёт владелец пространства. Общего входа по почте нет намеренно:
          заводить учётные записи на одного человека — лишний обряд.
        </p>
      </main>
    </div>
  );
}
