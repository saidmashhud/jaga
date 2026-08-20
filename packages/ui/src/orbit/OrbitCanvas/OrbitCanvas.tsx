import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../utils/cx';
import { RESET, type View, wheelFactor, zoomAt } from './view';
import styles from './OrbitCanvas.module.css';

export interface OrbitCanvasProps extends HTMLAttributes<HTMLDivElement> {
  /** Logical scene width — node coordinates live in this space. */
  sceneWidth?: number;
  /** Logical scene height. */
  sceneHeight?: number;
  /** Content of the SVG layer under the nodes: rings, connections. */
  svgLayer?: ReactNode;
  /** Renders the built-in atmospheric backdrop (gradients, noise, star dots). */
  backdrop?: boolean;
  /** Fired on Escape or a click on the empty background. */
  onClearSelection?: () => void;
  /** HTML layer in scene coordinates: glows, labels, nodes. */
  children?: ReactNode;
  /**
   * Можно ли приближать и возить полотно.
   *
   * Выключено по умолчанию: старая сцена вписывала всё в кадр и обходилась без
   * этого, и включать ей приближение задним числом незачем.
   */
  navigable?: boolean;
  /**
   * Сообщает наружу РУЧНОЕ приближение, а не действующий масштаб.
   *
   * Порог показа подписей должен отсчитываться от того, насколько человек сам
   * приблизил, а не от того, во сколько сцена вписалась в окно. Вписывающий
   * масштаб зависит от высоты окна и на обычном экране равен 0.8 — по нему
   * подписи внешних поясов не показывались никогда, ни на каком окне.
   */
  onScaleChange?: (zoom: number) => void;
}

/**
 * Main workspace scene. Positions children in a fixed logical coordinate
 * space and scales it to fit the container (recomputed only on resize).
 */
export function OrbitCanvas({
  sceneWidth = 1200,
  sceneHeight = 800,
  svgLayer,
  backdrop = true,
  onClearSelection,
  navigable = false,
  onScaleChange,
  className,
  children,
  ...rest
}: OrbitCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [view, setView] = useState<View>(RESET);
  // Откуда начали тянуть. null — не тянем.
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const next = Math.min(width / sceneWidth, height / sceneHeight);
      setScale(Math.max(0.45, Math.min(next, 1.6)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sceneWidth, sceneHeight]);

  // Действующий масштаб — вписывающий, помноженный на ручное приближение. По
  // нему сцена решает, показывать ли подписи: порог должен считаться от того,
  // насколько крупно человек ВИДИТ узел, а не от того, сколько он накрутил
  // колесом на большом экране.
  const effective = scale * view.zoom;
  useEffect(() => {
    onScaleChange?.(view.zoom);
  }, [view.zoom, onScaleChange]);

  const handleBackgroundClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClearSelection?.();
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!navigable) return;
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return;
    // Курсор относительно центра полотна: сдвиг считается от него же.
    const px = event.clientX - box.left - box.width / 2;
    const py = event.clientY - box.top - box.height / 2;
    setView((v) => zoomAt(v, wheelFactor(event.deltaY), px, py));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Тянем только за пустое место: протяжка по узлу — это его дело.
    //
    // Пустое место — это корень полотна ИЛИ сам слой сцены: слой растянут
    // поверх корня, и до корня указатель просто не доходит. Проверка «цель
    // равна корню» не срабатывала бы никогда.
    const onEmpty = event.target === event.currentTarget || event.target === sceneRef.current;
    if (!navigable || !onEmpty) return;
    drag.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = drag.current;
    if (!from) return;
    setView((v) => ({ ...v, x: from.vx + (event.clientX - from.x), y: from.vy + (event.clientY - from.y) }));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClearSelection?.();
  };

  return (
    <div
      ref={rootRef}
      className={cx(styles.root, backdrop && styles.backdrop, className)}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      {...rest}
    >
      {backdrop && (
        <>
          <div className={styles.glowField} aria-hidden="true" />
          <div className={styles.stars} aria-hidden="true" />
          <div className={styles.noise} aria-hidden="true" />
        </>
      )}
      <div
        className={styles.scene}
        style={{
          width: sceneWidth,
          height: sceneHeight,
          // Порядок важен: сперва масштаб, затем сдвиг в пикселях экрана,
          // затем центрирование. Тогда сдвиг остаётся экранным и не растёт
          // вместе с приближением — а именно этого ждёт арифметика в view.ts.
          transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${effective})`,
        }}
        onClick={handleBackgroundClick}
      >
        <svg
          className={styles.svg}
          viewBox={`0 0 ${sceneWidth} ${sceneHeight}`}
          width={sceneWidth}
          height={sceneHeight}
          aria-hidden="true"
        >
          {svgLayer}
        </svg>
        {children}
      </div>
    </div>
  );
}
