import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@cortex/tokens/tokens.css';
import './app/global.css';
import { App } from './app/App';
import { loadFromApi, toActivity, toTrackEvent } from './services/cortex-api';
import { hydrate } from './services/mock-cortex-service';

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
async function boot() {
  const loaded = await loadFromApi();
  if (loaded) {
    const { projects, connections, focus, lenses, events } = loaded.data;
    hydrate({
      projects,
      connections,
      focus,
      lenses,
      activities: events.map(toActivity),
      // Окно дорожки — неделя в обе стороны, ровно то, что показывает шкала
      // по умолчанию. Процент считается здесь, из времени события.
      trackEvents: events.map((e) => toTrackEvent(e, 24 * 7)),
    });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
