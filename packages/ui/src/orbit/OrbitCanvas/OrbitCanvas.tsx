import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../utils/cx';
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
  className,
  children,
  ...rest
}: OrbitCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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

  const handleBackgroundClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClearSelection?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClearSelection?.();
  };

  return (
    <div
      ref={rootRef}
      className={cx(styles.root, backdrop && styles.backdrop, className)}
      onKeyDown={handleKeyDown}
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
          transform: `translate(-50%, -50%) scale(${scale})`,
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
