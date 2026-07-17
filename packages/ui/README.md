# @cortex/ui

React-компоненты дизайн-системы Cortex. Полная документация состояний и props — в Storybook (`pnpm storybook` из корня).

## Подключение

```ts
// один раз на входе приложения
import '@fontsource-variable/inter';
import '@cortex/tokens/tokens.css';

// далее в любом модуле
import { Button, Surface, ProjectNode } from '@cortex/ui';
```

Компоненты стилизованы CSS Modules поверх CSS-переменных из `@cortex/tokens` — тема меняется атрибутом `data-theme` на `<html>` без пересборки.

## Состав

| Слой | Компоненты |
|---|---|
| primitives | `Text`, `Surface`, `Button`, `IconButton`, `Badge`, `StatusDot`, `Avatar`, `Tooltip`, `ProgressRing`, `TextField`, `SearchCommandField`, `Divider` |
| layout | `AppShell`, `Stack`, `Grid`, `ScrollableArea`, `Panel` |
| navigation | `NavigationRail`, `NavigationRailItem` |
| orbit | `OrbitCanvas`, `ProjectNode`, `UserCoreNode`, `OrbitConnection` (+`connectionMidpoint`/`connectionPointAt`), `ConnectionLabel`, `OrbitRing`, `SceneGlow` |
| insights | `FocusTaskCard`, `ActivityItem`, `RecommendationCard`, `LensChip` |
| timeline | `Timeline`, `TimelineEvent` |
| composer | `ContextComposer` |

## Правила использования

- **Данные не зашиваются в компоненты.** Всё содержимое приходит через props; моки живут в приложении.
- **Сцена Orbit.** `OrbitCanvas` задаёт логическое пространство 1200×800 и масштабирует его под контейнер. Связи и орбиты — в `svgLayer`, узлы/подписи/свечения — children в координатах сцены. Подпись связи ставьте в `connectionMidpoint(source, target)` либо `connectionPointAt(..., t)` при коллизиях.
- **Статусы.** Семантика — `SemanticStatus` из `@cortex/tokens` (`stable | working | attention | risk | paused | decision`). Цвет всегда дублируется текстом (`statusLabel`) или формой.
- **Пульсация** (`StatusDot pulse`, `UserCoreNode pulse`) — максимум 1–2 объекта на экран; при `prefers-reduced-motion` отключается автоматически.
- **Icon-only контролы** (`IconButton`) требуют `aria-label` (тип это форсирует) и `Tooltip`.
- **Tooltip не носитель истины** — критичная информация дублируется в интерфейсе.

## Accessibility

Все интерактивные элементы доступны с клавиатуры: Tab/Enter — выбор, Escape — снятие выбора (на уровне `OrbitCanvas`/страницы), стрелки — навигация в `NavigationRail` и `Timeline`. `focus-visible` использует токен `--focus-ring`. SVG-связи скрыты от screen reader (`aria-hidden` на слое сцены), смысловые подписи — HTML-элементы.
