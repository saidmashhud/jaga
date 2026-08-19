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
}

export const initialCortexState: CortexState = {
  navigationMode: 'orbit',
  selectedProjectId: null,
  enteredProjectId: null,
  hoveredProjectId: null,
  activeLensId: null,
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
  | { type: 'clear-selection' };

export function cortexReducer(state: CortexState, action: CortexAction): CortexState {
  switch (action.type) {
    case 'select-project':
      return { ...state, selectedProjectId: action.id };
    case 'toggle-project':
      return {
        ...state,
        selectedProjectId: state.selectedProjectId === action.id ? null : action.id,
      };
    case 'enter-project':
      return { ...state, enteredProjectId: action.id, selectedProjectId: action.id };
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
      return { ...state, navigationMode: action.mode };
    case 'toggle-recommendation':
      return { ...state, recommendationExpanded: !state.recommendationExpanded };
    case 'set-aside-open':
      return { ...state, asideOpen: action.value };
    case 'show-toast':
      return { ...state, toast: action.message };
    case 'dismiss-toast':
      return { ...state, toast: null };
    case 'clear-selection':
      return {
        ...state,
        selectedProjectId: null,
        hoveredProjectId: null,
        enteredProjectId: null,
      };
    default:
      return state;
  }
}
