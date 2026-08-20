import type { ActivityEvent, TimelinePointId } from '../mocks/types';
import type { TimelinePeriod } from '@cortex/ui';

export type NavigationMode = 'orbit' | 'focus' | 'inside' | 'decision' | 'settings';

export interface CortexState {
  navigationMode: NavigationMode;
  selectedProjectId: string | null;
  /** Project whose portal world the camera has entered (§6.2, depth level 2). */
  enteredProjectId: string | null;
  hoveredProjectId: string | null;
  activeLensId: string | null;
  timelinePointId: TimelinePointId;
  timelinePeriod: TimelinePeriod;
  completedFocusIds: string[];
  composerDraft: string;
  composerProcessing: boolean;
  composerListening: boolean;
  searchValue: string;
  searchListening: boolean;
  aiMode: boolean;
  recommendationExpanded: boolean;
  asideOpen: boolean;
  /** Composer-added events, newest first (prepended to mock activities). */
  addedActivities: ActivityEvent[];
  /** Id of the most recently added activity — gets the «fresh» animation. */
  freshActivityId: string | null;
  toast: string | null;
  /**
   * Черновик связи; null — форма закрыта.
   *
   * Живёт здесь, а не флагом внутри компонента, намеренно. Форма заведения
   * проекта устроена наоборот, и вышло так: поднять её флаг некому, и она
   * недостижима во всяком непустом пространстве. Состояние в общем месте
   * можно открыть откуда угодно.
   */
  linkDraft: LinkDraft | null;
  /** Открыта ли форма заведения проекта. Тот же довод. */
  creatingProject: boolean;
}

export interface LinkDraft {
  sourceId: string;
  targetId: string | null;
  kindId: string | null;
  strength: 1 | 2 | 3;
  label: string;
}

export const initialCortexState: CortexState = {
  navigationMode: 'orbit',
  selectedProjectId: null,
  enteredProjectId: null,
  hoveredProjectId: null,
  activeLensId: null,
  linkDraft: null,
  creatingProject: false,
  timelinePointId: 'now',
  timelinePeriod: 'week',
  completedFocusIds: [],
  composerDraft: '',
  composerProcessing: false,
  composerListening: false,
  searchValue: '',
  searchListening: false,
  aiMode: false,
  recommendationExpanded: false,
  asideOpen: false,
  addedActivities: [],
  freshActivityId: null,
  toast: null,
};

export type CortexAction =
  | { type: 'select-project'; id: string | null }
  | { type: 'toggle-project'; id: string }
  | { type: 'enter-project'; id: string }
  | { type: 'exit-project' }
  | { type: 'hover-project'; id: string | null }
  | { type: 'set-lens'; id: string | null }
  | { type: 'set-timeline-point'; id: TimelinePointId }
  | { type: 'set-timeline-period'; period: TimelinePeriod }
  | { type: 'toggle-focus-item'; id: string; completed: boolean }
  | { type: 'set-draft'; value: string }
  | { type: 'composer-processing'; value: boolean }
  | { type: 'composer-listening'; value: boolean }
  // Событие может отсутствовать: на живых данных запись сначала ложится в
  // базу и ждёт разбора, и до разбора её нечем поставить в ленту — ни
  // проекта, ни времени события у неё ещё нет.
  | { type: 'composer-added'; event: ActivityEvent | null; confirmation: string }
  | { type: 'set-search'; value: string }
  | { type: 'search-listening'; value: boolean }
  | { type: 'toggle-ai-mode' }
  | { type: 'set-navigation'; mode: NavigationMode }
  | { type: 'toggle-recommendation' }
  | { type: 'set-aside-open'; value: boolean }
  | { type: 'show-toast'; message: string }
  | { type: 'dismiss-toast' }
  | { type: 'clear-selection' }
  | { type: 'open-link'; sourceId: string; targetId?: string | null }
  | { type: 'close-link' }
  | { type: 'set-link-target'; id: string | null }
  | { type: 'set-link-kind'; id: string | null }
  | { type: 'set-link-strength'; value: 1 | 2 | 3 }
  | { type: 'set-link-label'; value: string }
  | { type: 'swap-link-ends' }
  | { type: 'open-new-project' }
  | { type: 'close-new-project' };

export function cortexReducer(state: CortexState, action: CortexAction): CortexState {
  switch (action.type) {
    case 'select-project':
      return { ...state, selectedProjectId: action.id };
    case 'open-link':
      // Форма связи и форма проекта — две панели на одном месте; открытая
      // вторая закрывает первую, иначе они лягут друг на друга.
      return {
        ...state,
        creatingProject: false,
        linkDraft: {
          sourceId: action.sourceId,
          targetId: action.targetId ?? null,
          kindId: null,
          strength: 2,
          label: '',
        },
      };
    case 'close-link':
      return { ...state, linkDraft: null };
    case 'set-link-target':
      return state.linkDraft ? { ...state, linkDraft: { ...state.linkDraft, targetId: action.id } } : state;
    case 'set-link-kind':
      return state.linkDraft ? { ...state, linkDraft: { ...state.linkDraft, kindId: action.id } } : state;
    case 'set-link-strength':
      return state.linkDraft ? { ...state, linkDraft: { ...state.linkDraft, strength: action.value } } : state;
    case 'set-link-label':
      return state.linkDraft ? { ...state, linkDraft: { ...state.linkDraft, label: action.value } } : state;
    case 'swap-link-ends':
      // Меняются местами оба конца, а не только цель: источник взят с
      // выбранного узла, и без обмена вторую раскладку концов не получить.
      return state.linkDraft && state.linkDraft.targetId
        ? {
            ...state,
            linkDraft: {
              ...state.linkDraft,
              sourceId: state.linkDraft.targetId,
              targetId: state.linkDraft.sourceId,
            },
          }
        : state;
    case 'open-new-project':
      return { ...state, creatingProject: true, linkDraft: null, navigationMode: 'orbit' };
    case 'close-new-project':
      return { ...state, creatingProject: false };
    case 'toggle-project':
      return {
        ...state,
        selectedProjectId: state.selectedProjectId === action.id ? null : action.id,
      };
    case 'enter-project':
      // Вход внутрь проекта закрывает форму связи: портал занимает то же
      // место, и форма осталась бы висеть поверх чужого мира.
      return {
        ...state,
        enteredProjectId: action.id,
        selectedProjectId: action.id,
        linkDraft: null,
      };
    case 'exit-project':
      return { ...state, enteredProjectId: null };
    case 'hover-project':
      return { ...state, hoveredProjectId: action.id };
    case 'set-lens':
      return {
        ...state,
        activeLensId: state.activeLensId === action.id ? null : action.id,
      };
    case 'set-timeline-point':
      return { ...state, timelinePointId: action.id };
    case 'set-timeline-period':
      return { ...state, timelinePeriod: action.period };
    case 'toggle-focus-item': {
      const completed = new Set(state.completedFocusIds);
      if (action.completed) completed.add(action.id);
      else completed.delete(action.id);
      return { ...state, completedFocusIds: [...completed] };
    }
    case 'set-draft':
      return { ...state, composerDraft: action.value };
    case 'composer-processing':
      return { ...state, composerProcessing: action.value };
    case 'composer-listening':
      return { ...state, composerListening: action.value };
    case 'composer-added':
      return {
        ...state,
        addedActivities: action.event
          ? [action.event, ...state.addedActivities]
          : state.addedActivities,
        freshActivityId: action.event?.id ?? state.freshActivityId,
        // Черновик очищается только когда запись принята: иначе при отказе
        // службы человек теряет написанное и не понимает, куда оно делось.
        composerDraft: action.event === null && action.confirmation.startsWith('Не удалось') ? state.composerDraft : '',
        composerProcessing: false,
        toast: action.confirmation,
      };
    case 'set-search':
      return { ...state, searchValue: action.value };
    case 'search-listening':
      return { ...state, searchListening: action.value };
    case 'toggle-ai-mode':
      return { ...state, aiMode: !state.aiMode };
    case 'set-navigation':
      // Форма связи гаснет при уходе в раздел: панель раздела занимает ровно
      // тот же прямоугольник слева, и две накладывались друг на друга — та,
      // что нарисована позже, прятала кнопку «Закрыть» у первой.
      return { ...state, navigationMode: action.mode, linkDraft: null };
    case 'toggle-recommendation':
      return { ...state, recommendationExpanded: !state.recommendationExpanded };
    case 'set-aside-open':
      return { ...state, asideOpen: action.value };
    case 'show-toast':
      return { ...state, toast: action.message };
    case 'dismiss-toast':
      return { ...state, toast: null };
    case 'clear-selection':
      // Форма связи закрывается вместе с выбором, а не вместо него.
      //
      // Раньше здесь стоял ранний возврат: при открытой форме действие только
      // гасило её. Задумано было под клик по пустому месту сцены, но то же
      // действие шлёт кнопка «Снять выбор» в карточке проекта — а она видна
      // одновременно с формой, на другом краю экрана. Нажатие на неё не
      // делало ничего из обещанного: выбор оставался, карточка оставалась,
      // пропадала панель совсем в другом месте.
      //
      // Escape при этом всё равно закрывает форму первым и выбор не трогает:
      // его перехватывает сама панель.
      return {
        ...state,
        linkDraft: null,
        selectedProjectId: null,
        hoveredProjectId: null,
        enteredProjectId: null,
      };
    default:
      return state;
  }
}
