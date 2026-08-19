import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { isLive, mockCortexService } from '../services/mock-cortex-service';
import { sendCapture } from '../services/cortex-api';
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

export function CortexProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cortexReducer, initialCortexState);

  /**
   * Запись из композера.
   *
   * На живых данных она уходит в базу как есть и там ждёт разбора: разбирать
   * будет модель, она ошибается и бывает недоступна, и терять написанное
   * человеком из-за чужой недоступности нельзя. Поэтому сохранение и разбор
   * разведены — сохранение обязано состояться всегда.
   *
   * Пока разбора нет, экран честно говорит «сохранено», а не придумывает
   * проект и срок, как это делал мок. Обещать разбор, которого не случилось,
   * хуже, чем не обещать ничего.
   */
  const submitComposer = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      dispatch({ type: 'composer-processing', value: true });

      if (!isLive()) {
        void mockCortexService
          .submitContext(text, state.selectedProjectId)
          .then(({ event, confirmation }) => {
            dispatch({ type: 'composer-added', event, confirmation });
          });
        return;
      }

      void sendCapture(text).then((capture) => {
        if (!capture) {
          // Отказ службы не должен выглядеть как успех: человек напишет
          // второй раз и потеряет первую запись, решив, что не отправилось.
          dispatch({
            type: 'composer-added',
            event: null,
            confirmation: 'Не удалось сохранить — попробуйте ещё раз.',
          });
          return;
        }
        dispatch({
          type: 'composer-added',
          // Событием запись станет после разбора; до тех пор её нечем
          // поставить на дорожку — ни проекта, ни времени события у неё нет.
          event: null,
          confirmation: 'Записано. Разберём и разложим по проектам.',
        });
      });
    },
    [state.selectedProjectId],
  );

  const setNavigationMode = useCallback((mode: NavigationMode) => {
    dispatch({ type: 'set-navigation', mode });
    // Тоста «появится на следующем этапе» здесь больше нет: разделы, которые
    // данные поддерживают, сделаны, а «Inside» убран из rail — вход внутрь
    // проекта давно есть по щелчку на сфере, и вторая дверь туда же не нужна.
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
