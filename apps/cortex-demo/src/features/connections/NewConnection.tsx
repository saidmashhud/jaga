import { useEffect, useMemo, useRef, useState } from 'react';
import { useCortex } from '../../state/CortexProvider';
import { mockCortexService } from '../../services/mock-cortex-service';
import { postJSON } from '../../services/cortex-api';
import { attentionGap, findExisting, missing, orderedEnds, phraseOf } from './link-phrase';
import styles from './NewConnection.module.css';

/**
 * Заведение связи между проектами.
 *
 * Связь — не украшение линией: из связей раскладка выводит место каждого узла,
 * и одна ошибочная перекашивает всю сцену, а не только этих двоих. Поэтому
 * форма построена вокруг обратимости: рядом с «Связать» человек видит, чем
 * связь обернётся, а убрать её можно там же, в карточке проекта.
 *
 * Направление объясняется фразой, а не словом «направление». «Кофейня даёт
 * деньги Фрилансу» человек читает целиком и сам видит, что порядок важен; у
 * взаимных видов на месте стрелки стоит тире, и порядок перестаёт что-либо
 * значить — это видно, а не написано.
 */

/** Крепость связи.
 *
 *  Числа измерены на самой раскладке, а не взяты на глаз: два узла, связанных
 *  «слегка», встают на 372, «обычно» — 305, «крепко» — 278. Проверка
 *  TestStrengthPullsCloser держит это утверждение, чтобы подпись не разошлась
 *  с поведением после первой же правки коэффициентов. */
const STRENGTHS: Array<{ value: 1 | 2 | 3; name: string; hint: string }> = [
  { value: 1, name: 'Слегка', hint: 'связь есть, но расстановке почти не мешает' },
  { value: 2, name: 'Обычно', hint: 'держит наравне с остальными связями' },
  { value: 3, name: 'Крепко', hint: 'держит строже прочих — эти двое встанут заметно ближе' },
];

const ATTENTION_NAME: Record<string, string> = {
  decision: 'Требует решения',
  risk: 'Риск',
  attention: 'Требует внимания',
  working: 'В работе',
  stable: 'Стабильно',
  paused: 'На паузе',
};

export function NewConnection() {
  const { state, dispatch } = useCortex();
  const draft = state.linkDraft;

  const projects = mockCortexService.getProjects();
  const connections = mockCortexService.getConnections();
  const kinds = mockCortexService.getConnectionKinds();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [nag, setNag] = useState<string | null>(null);
  const panel = useRef<HTMLFormElement>(null);
  const targetField = useRef<HTMLSelectElement>(null);

  // Фокус входит в панель при открытии: иначе человек, пришедший с клавиатуры,
  // остаётся стоять на кнопке позади формы и не догадывается, что она открыта.
  const opened = draft !== null;
  useEffect(() => {
    if (!opened) return;
    const first = panel.current?.querySelector<HTMLElement>('select, input, button');
    first?.focus();
  }, [opened]);

  const source = draft ? projects.find((p) => p.id === draft.sourceId) : undefined;
  const target = draft?.targetId ? projects.find((p) => p.id === draft.targetId) : undefined;
  const kind = draft?.kindId ? (kinds.find((k) => k.id === draft.kindId) ?? null) : null;

  const others = useMemo(
    () => (draft ? projects.filter((p) => p.id !== draft.sourceId) : []),
    [projects, draft],
  );

  // Единственный второй проект — это не выбор, а факт. Выпадающий список из
  // одного пункта изображал бы выбор там, где его нет.
  const onlyOne = others.length === 1 ? others[0] : null;
  useEffect(() => {
    if (draft && onlyOne && !draft.targetId) dispatch({ type: 'set-link-target', id: onlyOne.id });
  }, [draft, onlyOne, dispatch]);

  if (!draft || !source) return null;

  const known = target ? findExisting(connections, source.id, target.id) : null;
  const gap = target ? attentionGap(source.status, target.status) : 0;
  const phrase = phraseOf(kind, source.title, target?.title ?? null);
  const notReady = missing(draft.targetId, kind);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !source) return;
    // Кнопка не заперта намеренно: запертая кнопка молчит о причине, и человек
    // остаётся гадать, чего от него хотят. Нажатие называет недостающее.
    if (notReady) {
      setNag(notReady);
      targetField.current?.focus();
      return;
    }
    if (known) return;

    setBusy(true);
    setErr(null);
    setNag(null);
    const [from, to] = orderedEnds(kind, source.id, draft.targetId!);
    const r = await postJSON<{ id: string }>('/v1/connections', {
      sourceId: from,
      targetId: to,
      type: kind!.id,
      strength: draft.strength,
      label: draft.label.trim() || kind!.name,
    });
    setBusy(false);

    if (r.expired) {
      setErr('Сессия кончилась — войдите заново');
      return;
    }
    if (!r.ok) {
      setErr(r.error || 'Служба не смогла завести связь. Набранное сохранилось');
      return;
    }
    // Перезагрузка, а не догрузка: раскладку считает служба из всех связей
    // разом, и подставить одну линию на месте нельзя — переедут все узлы.
    window.location.reload();
  }

  return (
    <form className={styles.form} ref={panel} onSubmit={submit}>
      <h2 className={styles.title} id="link-title">
        Новая связь
      </h2>
      <p className={styles.lede}>
        Связи задают расстановку: пока связь есть, место обоих проектов считается с ней.
      </p>

      <div>
        <p className={styles.phrase}>
          <span className={styles.end}>{phrase.left}</span>
          <span className={styles.arrow}>{phrase.directed ? '→' : '—'}</span>
          <span className={kind ? styles.middle : styles.blank}>{phrase.middle}</span>
          <span className={styles.arrow}>{phrase.directed ? '→' : '—'}</span>
          <span className={target ? styles.end : styles.blank}>{phrase.right}</span>
        </p>
        <div className={styles.swapRow}>
          {phrase.directed ? (
            <button
              className={styles.swap}
              type="button"
              onClick={() => dispatch({ type: 'swap-link-ends' })}
              disabled={!target}
            >
              Наоборот
            </button>
          ) : (
            <span className={styles.mutual}>Порядок не важен — фраза читается в обе стороны.</span>
          )}
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Второй проект</span>
        {onlyOne ? (
          <span className={styles.only}>{onlyOne.title} — других дел пока нет.</span>
        ) : (
          <select
            ref={targetField}
            value={draft.targetId ?? ''}
            onChange={(e) => {
              dispatch({ type: 'set-link-target', id: e.target.value || null });
              setNag(null);
            }}
          >
            <option value="" disabled>
              Выберите проект
            </option>
            {others.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
      </label>

      {kinds.length === 0 ? (
        <p className={styles.err} role="alert">
          Служба не отдала список видов связи — обновите страницу
        </p>
      ) : (
        <fieldset className={styles.group}>
          <legend className={styles.label}>Что между ними</legend>
          {/* Разбито по флагу службы, а не по здешнему порядку: появится седьмой
              вид — он встанет в свою группу сам. */}
          {(['directed', 'mutual'] as const).map((half) => {
            const list = kinds.filter((k) => (half === 'directed' ? k.directed : !k.directed));
            if (list.length === 0) return null;
            return (
              <div key={half}>
                <p className={styles.groupTitle}>
                  {half === 'directed' ? 'здесь важно, что откуда' : 'здесь порядок не важен'}
                </p>
                {list.map((k) => (
                  <label key={k.id} className={draft.kindId === k.id ? styles.choiceOn : styles.choice}>
                    <input
                      type="radio"
                      name="kind"
                      value={k.id}
                      checked={draft.kindId === k.id}
                      onChange={() => {
                        dispatch({ type: 'set-link-kind', id: k.id });
                        setNag(null);
                      }}
                    />
                    <span>
                      <b>{k.name}</b>
                      <em>{k.hint}</em>
                    </span>
                  </label>
                ))}
              </div>
            );
          })}
        </fieldset>
      )}

      <fieldset className={styles.group}>
        <legend className={styles.label}>Насколько крепко</legend>
        {STRENGTHS.map((s) => (
          <label key={s.value} className={draft.strength === s.value ? styles.choiceOn : styles.choice}>
            <input
              type="radio"
              name="strength"
              checked={draft.strength === s.value}
              onChange={() => dispatch({ type: 'set-link-strength', value: s.value })}
            />
            <span>
              <b>{s.name}</b>
              <em>{s.hint}</em>
            </span>
          </label>
        ))}
      </fieldset>

      <label className={styles.field}>
        <span className={styles.label}>Подпись на линии</span>
        <input
          value={draft.label}
          maxLength={60}
          placeholder={kind ? kind.name : 'одни бариста'}
          onChange={(e) => dispatch({ type: 'set-link-label', value: e.target.value })}
        />
        <span className={styles.hint}>
          Оставите пусто — на линии будет написан вид связи.
          {draft.label.length > 45 && <span className={styles.counter}> {draft.label.length} / 60</span>}
        </span>
      </label>

      {known && target && (
        <div className={styles.known}>
          <span>
            {known.reversed
              ? `Они уже связаны в другую сторону: ${target.title} → ${known.link.label || 'связь'} → ${source.title}.`
              : `Эти проекты уже связаны: «${known.link.label || 'без подписи'}».`}
          </span>
          <span className={styles.note}>
            Одна пара — одна связь. Вторая линия легла бы поверх первой и стянула бы проекты вдвое
            сильнее, чем вы сказали.
          </span>
          <span className={styles.note}>
            Убрать её можно в карточке проекта, в списке связей.
          </span>
          <span className={styles.knownActions}>
            <button className={styles.link} type="button" onClick={() => dispatch({ type: 'close-link' })}>
              Закрыть форму
            </button>
          </span>
        </div>
      )}

      {gap >= 4 && target && (
        <p className={styles.note}>
          Эти проекты стоят на разных этажах внимания — «{ATTENTION_NAME[source.status] ?? source.status}»
          и «{ATTENTION_NAME[target.status] ?? target.status}». Связь сблизит их по кругу, но не по
          глубине: глубину задаёт только состояние.
        </p>
      )}

      {(err || nag) && (
        <p className={styles.err} role="alert">
          {err ?? nag}
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.submit} type="submit" disabled={busy || Boolean(known)}>
          {busy ? 'Связываем' : 'Связать'}
        </button>
        <button className={styles.cancel} type="button" onClick={() => dispatch({ type: 'close-link' })}>
          Отмена
        </button>
      </div>

      <p className={styles.foot}>
        Вид связи задаёт цвет линии и слово, которым она читается. После связи сцена пересчитается
        целиком: переедут все проекты, не только эти двое. Ошиблись — связь можно убрать в карточке
        проекта.
      </p>
    </form>
  );
}
