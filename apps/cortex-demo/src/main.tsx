import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Голос прибора и голос текста — разные гарнитуры.
//
// Inter здесь был не выбором, а значением по умолчанию: он стоит в половине
// интерфейсов и не говорит ни о чём. JetBrains Mono ведёт служебную речь —
// подписи, числа, состояния; Golos Text нарисован под кириллицу и читается
// теплее, чем гротески, сделанные под латиницу с кириллицей вдогонку.
import '@fontsource-variable/golos-text';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@cortex/tokens/tokens.css';
import './app/global.css';
import { App } from './app/App';
import { SignIn } from './features/auth/SignIn';
import { loadFromApi, startRefresh, toActivity, toTrackEvent } from './services/cortex-api';
import { hydrate, markSource } from './services/mock-cortex-service';

/**
 * Данные подтягиваются до первой отрисовки.
 *
 * Ждать здесь можно: без данных на экране всё равно нечего показать, а
 * отрисовать моки и через мгновение подменить их живыми — значит показать
 * человеку заведомо чужие цифры и заставить перечитать экран.
 *
 * Служба недоступна — работаем на моках. Стенд без бэкенда обязан
 * открываться: это его нормальное состояние на сегодня, а не поломка.
 */
/** Нужен ли вход и выполнен ли он. */
async function session(): Promise<{ required: boolean; signedIn: boolean }> {
  try {
    const r = await fetch('/v1/session', { cache: 'no-store' });
    if (!r.ok) return { required: false, signedIn: true };
    const d = await r.json();
    return { required: Boolean(d.keyRequired), signedIn: Boolean(d.signedIn) };
  } catch {
    // Служба недоступна — работаем на образце, вход не при чём.
    return { required: false, signedIn: true };
  }
}

async function boot() {
  const who = await session();
  if (who.required && !who.signedIn) {
    // Данные не грузим вовсе: служба их и не отдаст, а показать сцену на
    // образце за формой входа значило бы соврать о том, что за ней лежит.
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <SignIn onDone={() => window.location.reload()} />
      </StrictMode>,
    );
    return;
  }

  const loaded = await loadFromApi();
  // Источник данных отмечается прямо здесь, по факту ответа службы, — а не
  // выводится потом из того, пусто на экране или нет. Живое, но пустое
  // пространство ничем не отличается от образца, если судить по количеству
  // проектов, и интерфейс принимал одно за другое.
  markSource(loaded ? 'live' : 'sample');
  if (loaded) {
    const { projects, connections, focus, lenses, events, kinds, shape } = loaded.data;
    hydrate({
      projects,
      connections,
      focus,
      lenses,
      kinds,
      shape,
      recommendation: loaded.data.recommendation,
      activities: events.map(toActivity),
      // Окно дорожки — неделя в обе стороны, ровно то, что показывает шкала
      // по умолчанию. Процент считается здесь, из времени события.
      trackEvents: events.map((e) => toTrackEvent(e, 24 * 7)),
    });
  }

  // Дальше данные обновляются сами: запись из композера становится событием
  // только после разбора моделью, а он идёт минутами.
  if (loaded) {
    startRefresh(
      (d) => {
        hydrate({
          projects: d.projects,
          connections: d.connections,
          focus: d.focus,
          lenses: d.lenses,
          // Пустой словарь видов не кладём поверх непустого: одна осечка сети
          // иначе стирает выбор вида прямо в открытой форме.
          ...(d.kinds.length > 0 ? { kinds: d.kinds } : {}),
          ...(d.shape ? { shape: d.shape } : {}),
          recommendation: d.recommendation,
          activities: d.events.map(toActivity),
          trackEvents: d.events.map((e) => toTrackEvent(e, 24 * 7)),
        });
      },
      // Сессия кончилась — показываем вход, а не замерший экран. Перезагрузка
      // здесь честнее подмены разметки: страница спросит /v1/session заново и
      // сама решит, что показать.
      () => window.location.reload(),
    );
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
