import { useEffect, useState } from 'react';
import { isLive, mockCortexService } from '../../services/mock-cortex-service';
import { useCortex } from '../../state/CortexProvider';
import { NewProject } from '../projects/NewProject';
import styles from './ModePanel.module.css';

/**
 * Разделы rail поверх сцены.
 *
 * Четыре кнопки отвечали тостом «появится на следующем этапе». Кнопка,
 * которая всегда говорит «позже», обучает не нажимать — и заодно врёт про
 * готовность продукта. Здесь сделаны те разделы, которые данные уже
 * поддерживают; «Inside» убран из rail совсем, потому что вход внутрь
 * проекта давно есть по щелчку на сфере, и вторая дверь туда же не нужна.
 */

const IMPACT: Record<string, string> = { high: 'Высокий эффект', medium: 'Средний', low: 'Низкий' };

function Focus() {
  const items = mockCortexService.getFocusItems();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  async function toggle(id: string, next: boolean) {
    setDone((d) => ({ ...d, [id]: next }));
    // Отметка уходит в службу, но экран не ждёт ответа: человек отмечает
    // сделанное подряд, и подтверждение каждой галочки превратило бы это
    // в очередь. Ошибку покажет следующая загрузка — цена расхождения
    // здесь ниже, чем цена ожидания.
    try {
      const r = await fetch(`/v1/focus/${encodeURIComponent(id)}/done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: next }),
      });
      // Отказ не должен выглядеть успехом. Прежний расчёт «ошибку покажет
      // следующая загрузка» держался на опросе, который при истёкшей сессии
      // не загружал ничего: человек отмечал пять дел, список пустел, а в базе
      // не менялось ни строки.
      if (r.status === 401) {
        window.location.reload();
        return;
      }
      if (!r.ok) setFailed((f) => ({ ...f, [id]: true }));
    } catch {
      setFailed((f) => ({ ...f, [id]: true }));
    }
  }

  const open = items.filter((i) => !(done[i.id] ?? i.completed));

  return (
    <>
      <h2 className={styles.title}>Фокус</h2>
      <p className={styles.lede}>
        {open.length > 0
          ? `Осталось ${open.length} из ${items.length}. Это то, что двигает проекты сегодня.`
          : 'На сегодня всё. Это не значит, что дел нет, — значит, выбранное сделано.'}
      </p>
      <ul className={styles.list}>
        {items.map((i) => {
          const checked = done[i.id] ?? i.completed;
          return (
            <li key={i.id} className={checked ? styles.itemDone : styles.item}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => void toggle(i.id, e.target.checked)}
                />
                <span>
                  <b>{i.title}</b>
                  {i.description && <em>{i.description}</em>}
                  <small>
                    {IMPACT[i.impact] ?? i.impact}
                    {failed[i.id] && ' · не сохранилось'}
                  </small>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Decision() {
  // Что ждёт решения — вычисляется из данных, а не перечисляется руками:
  // список, записанный в код, устаревает в момент смены статуса.
  const waiting = mockCortexService.getProjects().filter((p) => p.status === 'decision');
  const heavy = mockCortexService.getFocusItems().filter((i) => i.impact === 'high' && !i.completed);

  return (
    <>
      <h2 className={styles.title}>Решения</h2>
      <p className={styles.lede}>
        {waiting.length + heavy.length > 0
          ? 'Здесь ждут именно вас: без решения дальше не двинется.'
          : 'Ничего не ждёт вашего решения.'}
      </p>

      {waiting.length > 0 && (
        <ul className={styles.list}>
          {waiting.map((p) => (
            <li key={p.id} className={styles.item}>
              <span>
                <b>{p.title}</b>
                <em>{p.summary}</em>
                <small>{p.statusLabel}</small>
              </span>
            </li>
          ))}
        </ul>
      )}

      {heavy.length > 0 && (
        <>
          <h3 className={styles.sub}>Задачи высокого эффекта</h3>
          <ul className={styles.list}>
            {heavy.map((i) => (
              <li key={i.id} className={styles.item}>
                <span>
                  <b>{i.title}</b>
                  {i.description && <em>{i.description}</em>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Settings() {
  const live = isLive();
  const [who, setWho] = useState<string>('');
  useEffect(() => {
    void fetch('/v1/session', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWho(d?.who ?? ''))
      .catch(() => undefined);
  }, []);
  return (
    <>
      <h2 className={styles.title}>Настройки</h2>
      <p className={styles.lede}>
        Пока настраивать нечего — но откуда взялось то, что на экране, знать
        полезно: без этого не отличить пустую базу от подменённых данных.
      </p>
      <dl className={styles.facts}>
        {who && (
          <div>
            <dt>Вошли как</dt>
            <dd>{who}</dd>
          </div>
        )}
        <div>
          <dt>Источник данных</dt>
          <dd>{live ? 'Служба Cortex' : 'Встроенный образец'}</dd>
        </div>
        <div>
          <dt>Проектов</dt>
          <dd>{mockCortexService.getProjects().length}</dd>
        </div>
        <div>
          <dt>Связей</dt>
          <dd>{mockCortexService.getConnections().length}</dd>
        </div>
        <div>
          <dt>Расположение узлов</dt>
          <dd>{live ? 'Считает служба из связей' : 'Из образца'}</dd>
        </div>
      </dl>
      {!live && (
        <p className={styles.warn}>
          Служба недоступна, показан встроенный образец. Записи из строки внизу
          сохранены не будут.
        </p>
      )}
    </>
  );
}

export function ModePanel() {
  const { state, setNavigationMode } = useCortex();
  const [creating, setCreating] = useState(false);
  const mode = state.navigationMode;

  // Пустое пространство зовёт завести первый проект прямо со сцены: там
  // человек и стоит, когда ему нечего смотреть. Отправлять его искать
  // кнопку в разделах значило бы оставить пустоту без ответа.
  if (mode === 'orbit') {
    const empty = mockCortexService.getProjects().length === 0;
    if (!empty && !creating) return null;
    return (
      <aside className={styles.panel} role="dialog" aria-label="Новый проект">
        {creating || empty ? (
          <>
            {!empty && (
              <button className={styles.close} onClick={() => setCreating(false)}>
                Закрыть
              </button>
            )}
            {empty && !creating && (
              <>
                <h2 className={styles.title}>Пространство пустое</h2>
                <p className={styles.lede}>
                  Сцена показывает ваши дела и связи между ними. Начните с
                  первого — остальное встанет вокруг него само.
                </p>
              </>
            )}
            {(creating || empty) && (
              <NewProject
                onDone={() => {
                  setCreating(false);
                  // Перезагрузка, а не догрузка: раскладка считается службой
                  // из всех связей разом, и дорисовать один узел на месте
                  // нельзя — переедут все.
                  window.location.reload();
                }}
                onCancel={() => setCreating(false)}
              />
            )}
          </>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className={styles.panel} role="dialog" aria-label="Раздел">
      <button className={styles.close} onClick={() => setNavigationMode('orbit')}>
        Закрыть
      </button>
      {mode === 'focus' && <Focus />}
      {mode === 'decision' && <Decision />}
      {mode === 'settings' && <Settings />}
    </aside>
  );
}
