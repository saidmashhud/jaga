import { useEffect } from 'react';
import { useCortex } from '../../state/CortexProvider';
import { NewConnection } from './NewConnection';
import styles from './LinkPanel.module.css';

/**
 * Оболочка формы связи.
 *
 * Стоит отдельно от ModePanel намеренно: тамошний гейт рассчитан на пустое
 * пространство и прячет панель, как только появился хоть один проект, — а
 * связь осмысленна ровно наоборот, начиная со второго.
 */
export function LinkPanel() {
  const { state, dispatch } = useCortex();
  const open = state.linkDraft !== null;

  // Escape закрывает форму первой, не дойдя до общего обработчика: иначе он
  // снял бы выбор проекта, то есть выдернул бы из формы её же источник.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      dispatch({ type: 'close-link' });
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, dispatch]);

  if (!open) return null;

  return (
    <aside className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="link-title">
      <NewConnection />
    </aside>
  );
}
