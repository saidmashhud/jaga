import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { mockCortexService } from '../services/mock-cortex-service';
import {
  cortexReducer,
  initialCortexState,
  type CortexAction,
  type CortexState,
  type NavigationMode,
} from './cortex-state';

interface CortexContextValue {
  state: CortexState;
  dispatch: Dispatch<CortexAction>;
  /** Submit the composer draft: processing → mock event → toast. */
  submitComposer: (text: string) => void;
  /** Switch navigation; non-Orbit modes show a demo toast (stage 1). */
  setNavigationMode: (mode: NavigationMode) => void;
}

const CortexContext = createContext<CortexContextValue | null>(null);

const modeLabels: Record<Exclude<NavigationMode, 'orbit'>, string> = {
  focus: 'Focus',
  inside: 'Inside',
  decision: 'Decision',
  settings: 'Настройки',
};

export function CortexProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cortexReducer, initialCortexState);

  const submitComposer = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      dispatch({ type: 'composer-processing', value: true });
      void mockCortexService
        .submitContext(text, state.selectedProjectId)
        .then(({ event, confirmation }) => {
          dispatch({ type: 'composer-added', event, confirmation });
        });
    },
    [state.selectedProjectId],
  );

  const setNavigationMode = useCallback((mode: NavigationMode) => {
    dispatch({ type: 'set-navigation', mode });
    if (mode !== 'orbit') {
      dispatch({
        type: 'show-toast',
        message: `Режим «${modeLabels[mode]}» появится на следующем этапе.`,
      });
    }
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, submitComposer, setNavigationMode }),
    [state, submitComposer, setNavigationMode],
  );

  return <CortexContext.Provider value={value}>{children}</CortexContext.Provider>;
}

export function useCortex(): CortexContextValue {
  const ctx = useContext(CortexContext);
  if (!ctx) throw new Error('useCortex must be used within CortexProvider');
  return ctx;
}
