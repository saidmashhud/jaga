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
| orbit3d ¹ | `OrbitScene3D`, `ProjectSphere`, `UserCore3D`, `Connection3D`, `ConnectionLabel3D`, `OrbitRing3D`, `PortalCard`, `InsightPanel3D`, `SceneEffects`, `useSceneCapabilities` |

¹ Отдельная точка входа `@cortex/ui/orbit3d` — тянет three + drei + rapier (~1.1 МБ gzip). Импортируйте только лениво. Для детекта возможностей есть узкий вход `@cortex/ui/orbit3d/capabilities`, свободный от three.

## 3D-сцена (orbit3d)

```tsx
const Scene = lazy(() => import('./Scene3D'));
const { webgl, reducedMotion, quality, dpr } = useSceneCapabilities();
if (!webgl || reducedMotion) return <SvgScene />;   // фолбэк обязателен
```

Правила слоя:

- **WebGL не читает CSS-переменные.** Все цвета сцены берутся из `scene-tokens.ts` (мост к `rawColors` из `@cortex/tokens`) — не хардкодьте цвет в материале.
- **Узел — это контрол, а не декорация.** Не добавляйте в сцену коллайдер под курсором (как в ballpit-демо pmndrs): он физически выталкивает узел из-под клика.
- **Физика не должна ломать раскладку.** Тела свободны по всем трём осям, но пружина возвращает их к моковой координате из `Project.position` — сцена дышит, а композиция остаётся узнаваемой.
- **Глубина — это смысл, а не декор.** `position.z` кодирует срочность: требующее решения ближе к зрителю, приостановленное — дальше. Не раскладывайте z «на глаз» ради красоты.
- **Камера не должна воровать клик.** Вращение мышью — это тоже «клик по пустоте»: сбрасывайте выбор только если указатель прошёл меньше ~6px, иначе любое вращение снимает выделение. Авто-орбита выключается при первом касании сцены, чтобы узел не уплывал из-под курсора.
- **Подписи — DOM (`<Html>`), а не 3D-текст.** Это то, что сохраняет клавиатуру и screen reader; `<canvas>` помечен `aria-hidden`.
- **Ровно одна сцена в DOM.** Два рендерера одновременно = две кнопки с одинаковым доступным именем.
- **Эмиссия низкая.** Bloom её умножает; пересвеченный узел читается как «белый» и теряет статус-цвет (§6.3).

## Правила использования

- **Данные не зашиваются в компоненты.** Всё содержимое приходит через props; моки живут в приложении.
- **Сцена Orbit.** `OrbitCanvas` задаёт логическое пространство 1200×800 и масштабирует его под контейнер. Связи и орбиты — в `svgLayer`, узлы/подписи/свечения — children в координатах сцены. Подпись связи ставьте в `connectionMidpoint(source, target)` либо `connectionPointAt(..., t)` при коллизиях.
- **Статусы.** Семантика — `SemanticStatus` из `@cortex/tokens` (`stable | working | attention | risk | paused | decision`). Цвет всегда дублируется текстом (`statusLabel`) или формой.
- **Пульсация** (`StatusDot pulse`, `UserCoreNode pulse`) — максимум 1–2 объекта на экран; при `prefers-reduced-motion` отключается автоматически.
- **Icon-only контролы** (`IconButton`) требуют `aria-label` (тип это форсирует) и `Tooltip`.
- **Tooltip не носитель истины** — критичная информация дублируется в интерфейсе.

## Accessibility

Все интерактивные элементы доступны с клавиатуры: Tab/Enter — выбор, Escape — снятие выбора (на уровне `OrbitCanvas`/страницы), стрелки — навигация в `NavigationRail` и `Timeline`. `focus-visible` использует токен `--focus-ring`. SVG-связи скрыты от screen reader (`aria-hidden` на слое сцены), смысловые подписи — HTML-элементы.
