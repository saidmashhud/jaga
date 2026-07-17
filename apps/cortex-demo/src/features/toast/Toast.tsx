import { useEffect } from 'react';
import { CloseIcon } from '@cortex/icons';
import { useCortex } from '../../state/CortexProvider';
import styles from './Toast.module.css';

const AUTO_DISMISS_MS = 4000;

/**
 * Single app-level toast. role="status" doubles as the live region that
 * announces composer confirmations to screen readers.
 */
export function Toast() {
  const { state, dispatch } = useCortex();

  useEffect(() => {
    if (!state.toast) return;
    const timer = setTimeout(() => dispatch({ type: 'dismiss-toast' }), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [state.toast, dispatch]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {state.toast && (
        <div className={styles.toast}>
          <span className={styles.message}>{state.toast}</span>
          <button
            type="button"
            className={styles.close}
            aria-label="Закрыть уведомление"
            onClick={() => dispatch({ type: 'dismiss-toast' })}
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
