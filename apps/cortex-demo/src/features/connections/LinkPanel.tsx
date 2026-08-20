import { useEffect, useRef } from 'react';
import { useCortex } from '../../state/CortexProvider';
import { NewConnection } from './NewConnection';
import styles from './LinkPanel.module.css';

/** Что вообще можно сфокусировать. Запертое исключено: focus() на нём —
 *  пустая операция, и фокус молча остаётся там, где был. */
const FOCUSABLE =
  'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Оболочка формы связи.
 *
 * Стоит отдельно от ModePanel намеренно: тамошний гейт рассчитан на пустое
 * пространство и прячет панель, как только появился хоть один проект, — а
 * связь осмысленна ровно наоборот, начиная со второго.
 *
 * Здесь же держится фокус. Панель объявлена aria-modal, то есть для читалки
 * экрана всё за её пределами перестало существовать; отпустить туда фокус
 * значит оставить человека в тишине, на кнопке, которой для него уже нет.
 * Поэтому фокус заводится внутрь при открытии, ходит по кругу внутри и
 * возвращается на открывшую кнопку при закрытии.
 */
export function LinkPanel() {
  const { state, dispatch } = useCortex();
  const open = state.linkDraft !== null;
  const box = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    opener.current = document.activeElement;
    // Фокус на саму панель, а не на первое поле: читалка прочтёт заголовок
    // диалога целиком, а человек услышит, куда попал, прежде чем услышит,
    // что от него хотят.
    box.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Escape гасится здесь: общий обработчик страницы снял бы выбор
        // проекта, то есть выдернул бы из формы её же источник.
        e.stopPropagation();
        dispatch({ type: 'close-link' });
        return;
      }
      if (e.key !== 'Tab' || !box.current) return;

      const inside = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (inside.length === 0) return;
      const first = inside[0];
      const last = inside[inside.length - 1];
      const now = document.activeElement;

      // Круг замыкается в обе стороны, и снаружи внутрь тоже: если фокус
      // каким-то путём оказался вне панели, следующий Tab возвращает его.
      if (!box.current.contains(now)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (now === first || now === box.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && now === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      // Возврат на открывшую кнопку: без него фокус после закрытия падает на
      // body, и человек с клавиатуры начинает обход страницы заново.
      const back = opener.current;
      if (back instanceof HTMLElement && back.isConnected) back.focus();
    };
  }, [open, dispatch]);

  if (!open) return null;

  return (
    <aside
      ref={box}
      tabIndex={-1}
      className={styles.panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-title"
    >
      <NewConnection />
    </aside>
  );
}
