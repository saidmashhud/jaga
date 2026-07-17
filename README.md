# Cortex / Attention OS

Дизайн-система **Cortex** и демонстрационная страница **Orbit** — интерфейс, который управляет вниманием: показывает, какие проекты требуют внимания, где риск, какие решения нужны сейчас и что изменилось за период.

Первый этап — frontend-прототип с моковыми данными (без backend, авторизации и реального ИИ).

![стек](https://img.shields.io/badge/React%2018-TypeScript-blue) ![storybook](https://img.shields.io/badge/Storybook-8-ff4785)

## Структура monorepo

```text
apps/
  cortex-demo/     — демо-приложение Cortex, страница Orbit
packages/
  tokens/          — дизайн-токены (@cortex/tokens): CSS-переменные + типизированные экспорты
  icons/           — SVG-иконки (@cortex/icons): currentColor, размер через props
  ui/              — компоненты дизайн-системы (@cortex/ui)
    src/orbit3d/   — 3D-сцена на React Three Fiber (@cortex/ui/orbit3d)
```

## ⚠️ Отклонение от ТЗ: сцена Orbit в 3D

По решению заказчика (17.07.2026) сцена Orbit переведена с SVG на **WebGL/React Three Fiber**. Это осознанно расходится с ТЗ, и вот с чем именно:

| Пункт ТЗ | Что говорит | Как сейчас |
|---|---|---|
| §5 | «тяжёлый Canvas/WebGL-движок не требуется, сцену — через SVG и HTML-слои» | сцена на R3F; SVG-рендерер сохранён как фолбэк |
| §3 | «сложный физический движок расположения узлов» — не входит в этап | узлы — тела rapier с пружиной к моковой координате |
| §16 | «интерактивность на ноутбуке без дискретной графики» | по умолчанию только bloom; SSGI — opt-in |
| §15/§18 | клавиатура, screen reader, «нет критических a11y-ошибок» | подписи узлов — реальный DOM поверх канваса |

**Как сохранена доступность.** Подписи и кнопки узлов рендерятся через `<Html>` drei — это настоящий DOM внутри сцены, поэтому Tab/Enter, `aria-label`, `aria-pressed` и статус текстом продолжают работать; сам `<canvas>` помечен `aria-hidden`. Escape разматывает глубину по одному уровню: overlay-панель → портал проекта → выбор.

**Фолбэк.** Без WebGL и при `prefers-reduced-motion` рендерится прежняя SVG-сцена: физика и «дышащее» ядро — ровно то, что §15 требует отключать. В jsdom WebGL нет, поэтому все 41 тест идут по SVG-пути.

**Производительность.** three + drei + rapier (~1.1 МБ gzip) вынесены в ленивый чанк: entry — 67 КБ gzip. `useSceneCapabilities` импортируется отдельной точкой входа `@cortex/ui/orbit3d/capabilities`, иначе индекс `orbit3d` тянет three в entry.

**Про SSGI.** `realism-effects` собран под более старый three API, чем зафиксированный 0.165 (ругается на `copyFramebufferToTexture` и `WebGLMultipleRenderTargets`). Поэтому SSGI не включается автоматически — только явно через `?quality=ssgi`; штатный режим — `bloom`. Доступные значения: `?quality=ssgi|bloom|off`.

**Что осталось нечестным:** визуальная регрессия сцены не покрыта — WebGL-кадр в Chromatic нестабилен; interaction-тесты 3D-узлов не написаны (jsdom не рендерит канвас), проверялись вручную в браузере.

## Быстрый старт

```bash
pnpm install

pnpm dev              # демо-приложение → http://localhost:5173
pnpm storybook        # Storybook → http://localhost:6006

pnpm test             # unit- и interaction-тесты (Vitest + Testing Library)
pnpm typecheck        # tsc по всем пакетам
pnpm build            # production-сборка демо
pnpm build-storybook  # статическая сборка Storybook
pnpm chromatic        # визуальная регрессия (нужен CHROMATIC_PROJECT_TOKEN)
```

Требования: Node 20+, pnpm 9.

## Подключение дизайн-системы

1. Добавьте зависимости workspace:

```jsonc
// package.json
"dependencies": {
  "@cortex/tokens": "workspace:*",
  "@cortex/icons": "workspace:*",
  "@cortex/ui": "workspace:*"
}
```

2. Подключите токены и шрифт один раз на входе приложения:

```ts
import '@fontsource-variable/inter';
import '@cortex/tokens/tokens.css';
```

3. Используйте компоненты:

```tsx
import { AppShell, ProjectNode, FocusTaskCard, Timeline } from '@cortex/ui';
import { OrbitIcon } from '@cortex/icons';
import { statusColorVar } from '@cortex/tokens';
```

Подробный гайд по компонентам — в [packages/ui/README.md](packages/ui/README.md) и в Storybook (каждый компонент: назначение, anatomy, props, состояния, accessibility).

## Ключевые принципы (из ТЗ)

- **Интерфейс управляет вниманием** — иерархия видна за 5–10 секунд без чтения всех блоков.
- **Глубина вместо страниц** — портфель → проект → точка внимания → решение.
- **Цвет семантичен, но не одинок** — каждое состояние дублируется текстом/иконкой/формой.
- **Анимация объясняет изменения** — приоритет, обновление, переход уровня, связь, решение.
- **Ограниченная сложность** — не более 5–7 главных узлов на сцене; второстепенные связи скрываются до hover/выбора/линзы.

## Что реализовано на этапе 1

- Дизайн-токены §8: цвета, типографика (Inter), отступы 4px, радиусы, elevation + semantic glow, motion (120/200/360/600 мс, `cubic-bezier(0.22, 1, 0.36, 1)`), слои, размеры.
- 27 компонентов дизайн-системы с CSS Modules, все — без жёстко заданных проектных данных.
- Storybook: Foundations (Colors/Typography/Spacing/Radius/Shadows/Motion/Icons), все компоненты со состояниями (variants, disabled, loading, long text, empty), автогенерация props-документации, a11y-checks, viewport-пресеты (1280/1366/1536/1920), переключатель темы (light — экспериментальный контракт токенов), interaction-тесты (play-функции на странице Orbit).
- Страница Orbit: сцена 1200×800 (SVG-связи + HTML-узлы, масштабирование только на resize), 6 проектов, центральный узел «Вы/Сейчас», подписанные связи, hover/selected/dimmed, линзы, «Фокус сегодня», «Что происходит», AI-рекомендация с «Почему?», timeline (неделя/месяц, минимум три состояния сцены), Composer с моковым processing и live-region подтверждением.
- Данные вынесены в `apps/cortex-demo/src/mocks/*`; доступ — только через `services/mock-cortex-service.ts` (готов к замене на API-клиент).
- Accessibility: клавиатура (Tab/Enter/Escape, стрелки в rail и timeline), focus-visible, aria-подписи icon-only контролов, статусы текстом, `prefers-reduced-motion` (пульсации и перемещения отключаются), live region для Composer.
- Тесты: 41 (Button, NavigationRailItem, ProjectNode, FocusTaskCard, LensChip, ContextComposer, Timeline + 11 интеграционных сценариев страницы Orbit).

## Не входит в этап 1

Backend, авторизация, реальный ИИ, интеграции (Jira/Notion/Telegram/Gmail), совместная работа, мобильная версия, drag-and-drop графа, физический движок раскладки, полный редактор проектов, светлая тема (в токенах — только экспериментальный контракт для Storybook).

## Responsive

- **1440+** — полный интерфейс, rail с подписями, все подписи связей.
- **1280–1439** — компактный rail (иконки + tooltip), уже панель, часть подписей связей скрыта.
- **<1280** — правая панель открывается как overlay (кнопка в хедере), сцена сохраняет просмотр и выбор.
