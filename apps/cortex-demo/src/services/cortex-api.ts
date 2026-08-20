/**
 * Сетевой источник данных Cortex.
 *
 * Компоненты читают данные синхронно — `getProjects(): Project[]`, — поэтому
 * «подменить мок клиентом одной строкой» буквально нельзя: сеть асинхронна.
 * Вместо этого данные загружаются один раз при старте и дальше отдаются той
 * же синхронной формой. Компоненты не знают, откуда они пришли, и не меняются.
 *
 * Адрес службы задаётся во время работы, а не при сборке: статику собирают
 * один раз, а стендов у неё несколько. Файл `config.json` лежит рядом с
 * `index.html`, и подменить его — это правка конфигурации, а не пересборка.
 */
import type {
  ActivityEvent,
  Recommendation,
  FocusItem,
  Lens,
  Project,
  ProjectConnection,
  TimelineMockEvent,
} from '../mocks/types';

export interface RuntimeConfig {
  /** Пусто или отсутствует — приложение работает на моках. */
  apiUrl?: string;
  tenantId?: string;
}

/** Событие как его отдаёт служба: с отметкой времени, а не процентом дорожки. */
interface ApiEvent {
  id: string;
  projectId: string;
  title: string;
  type: ActivityEvent['type'];
  intensity: 1 | 2 | 3;
  occurredAt: string;
}

/** Сессия кончилась. Отдельный вид отказа: лечится входом, а не ожиданием. */
export class SessionExpired extends Error {
  constructor() {
    super('сессия истекла');
    this.name = 'SessionExpired';
  }
}

export interface CortexData {
  projects: Project[];
  /** Бриф на сегодня; null — ещё не собран, и блок просто не показывается. */
  recommendation: Recommendation | null;
  connections: ProjectConnection[];
  focus: FocusItem[];
  lenses: Lens[];
  events: ApiEvent[];
}

async function readConfig(): Promise<RuntimeConfig> {
  try {
    // no-store: файл настроек меняют между раскатами, и закешированный
    // браузером старый адрес пережил бы переезд службы.
    const r = await fetch('/config.json', { cache: 'no-store' });
    if (!r.ok) return {};
    return (await r.json()) as RuntimeConfig;
  } catch {
    return {};
  }
}

/**
 * Загружает всё разом.
 *
 * Пять запросов параллельно, а не один сводный: экран показывает пять
 * независимых срезов, и сводный ответ пришлось бы менять при добавлении
 * шестого. Отказ любого из них роняет загрузку целиком — половина данных
 * на сцене хуже, чем честный откат к мокам.
 */
export async function loadFromApi(): Promise<{ data: CortexData; tenant: string } | null> {
  const cfg = await readConfig();
  // Отсутствующий адрес — работаем на моках. Адрес «/» означает тот же
  // источник, что и страница: служба проброшена туннелем на тот же хост, и
  // межисточниковых запросов при этом нет вовсе.
  if (cfg.apiUrl === undefined || cfg.apiUrl === '') return null;
  const base = cfg.apiUrl.replace(/\/+$/, '');

  const tenant = cfg.tenantId ?? 'demo';
  const get = async <T>(path: string, key: string): Promise<T> => {
    const r = await fetch(`${base}${path}`, {
      headers: { 'X-Tenant-Id': tenant },
      cache: 'no-store',
    });
    // Истёкшая сессия — не «служба недоступна». Раньше 401 попадал в тот же
    // catch, что и обрыв связи, и предупреждение в консоли врало: говорило
    // «служба недоступна», хотя служба жива и просто не пускает.
    if (r.status === 401) throw new SessionExpired();
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    const body = await r.json();
    return body[key] as T;
  };

  try {
    // Бриф спрашивается отдельно: его отсутствие — не отказ, а «ещё не
    // собран», и ронять из-за этого всю загрузку нельзя.
    const brief = await fetch(`${base}/v1/brief`, {
      headers: { 'X-Tenant-Id': tenant },
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      // Служба отвечает 200 с brief: null, когда бриф ещё не собран.
      .then((b) => (b && b.title ? b : null))
      .then((b) =>
        b
          ? ({
              id: 'brief-today',
              title: b.title,
              description: b.description,
              reasons: b.reasons ?? [],
              projectIds: b.projectIds ?? [],
            } as Recommendation)
          : null,
      )
      .catch(() => null);

    const [projects, connections, focus, lenses, events] = await Promise.all([
      get<Project[]>('/v1/projects', 'projects'),
      get<ProjectConnection[]>('/v1/connections', 'connections'),
      get<FocusItem[]>('/v1/focus', 'focus'),
      get<Lens[]>('/v1/lenses', 'lenses'),
      get<ApiEvent[]>('/v1/events', 'events'),
    ]);

    // Пустое пространство — законное состояние, а не повод откатиться к
    // образцу. Прежнее правило приводило к худшему, что может показать
    // продукт: человек заводит своё пространство, открывает его и видит
    // шесть чужих проектов как будто свои.
    //
    // Отличать надо не «пусто или нет», а «служба ответила или нет»: первое
    // означает «вам ещё нечего смотреть», второе — «мы не смогли спросить».

    return { data: { projects, connections, focus, lenses, events, recommendation: brief }, tenant };
  } catch (e) {
    // Истёкшую сессию пробрасываем наверх: там решат показать вход.
    // Проглотить её здесь значило бы оставить экран замёрзшим навсегда.
    if (e instanceof SessionExpired) throw e;
    console.warn('[cortex] служба недоступна, работаем на моках:', e);
    return null;
  }
}

/**
 * Событие службы → строка ленты «что происходит».
 *
 * Лента показывает «2 ч назад», и ей нужна отметка времени как есть.
 */
export function toActivity(e: ApiEvent): ActivityEvent {
  return { id: e.id, projectId: e.projectId, title: e.title, createdAt: e.occurredAt, type: e.type };
}

/**
 * Событие службы → отметка на дорожке.
 *
 * Процент вдоль дорожки считается здесь, из окна, а не приходит из данных:
 * он и есть свойство окна. Пока процент лежал в базе, переключатель
 * «неделя / месяц» не мог пересчитать ничего — обе шкалы показывали одно.
 */
export function toTrackEvent(e: ApiEvent, windowHours: number, now = Date.now()): TimelineMockEvent {
  const half = windowHours * 3600 * 1000;
  const at = new Date(e.occurredAt).getTime();
  const raw = ((at - (now - half)) / (2 * half)) * 100;
  return {
    id: e.id,
    projectId: e.projectId,
    position: Math.min(100, Math.max(0, raw)),
    type: e.type,
    intensity: e.intensity,
    label: e.title,
    future: at > now,
  };
}

/** Отправка записи из композера. Возвращает false, если служба не настроена. */
export async function sendCapture(text: string): Promise<boolean> {
  const cfg = await readConfig();
  if (cfg.apiUrl === undefined || cfg.apiUrl === '') return false;
  const base = cfg.apiUrl.replace(/\/+$/, '');
  try {
    const r = await fetch(`${base}/v1/captures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': cfg.tenantId ?? 'demo' },
      body: JSON.stringify({ text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Периодическое обновление.
 *
 * Разбор записи занимает минуты, и без опроса человек не увидит её никогда:
 * данные загружаются при старте, а событие появляется потом. Раз в полминуты
 * — компромисс между «увидел вскоре» и «не долбим службу»; страница, скрытая
 * от глаз, не опрашивает вовсе.
 */
export function startRefresh(
  apply: (d: CortexData) => void,
  onExpired: () => void,
  everyMs = 30000,
): () => void {
  let stopped = false;

  const tick = async () => {
    if (stopped || document.hidden) return;
    try {
      const loaded = await loadFromApi();
      if (loaded && !stopped) apply(loaded.data);
    } catch (e) {
      if (e instanceof SessionExpired) {
        // Опрос останавливаем: он всё равно будет получать отказ, а экран
        // тем временем показывал бы срез на момент истечения как свежий.
        // Прибор, уверенно показывающий вчерашнее, хуже прибора молчащего.
        stopped = true;
        onExpired();
      }
    }
  };

  const timer = window.setInterval(() => void tick(), everyMs);
  // Возврат на вкладку — повод обновиться немедленно: человек ушёл, вернулся
  // и вправе увидеть свежее, а не ждать следующего оборота таймера.
  const onShow = () => { if (!document.hidden) void tick(); };
  document.addEventListener('visibilitychange', onShow);

  return () => {
    stopped = true;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onShow);
  };
}
