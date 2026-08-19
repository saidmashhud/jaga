import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import { nodeVector, useNodePositionStore } from './node-positions';

export interface Connection3DProps {
  sourceId: string;
  targetId: string;
  color: string;
  strength?: 1 | 2 | 3;
  /** Flowing dash animation — reserved for the relation that needs a decision. */
  animated?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  reducedMotion?: boolean;
}

const mid = new THREE.Vector3();
const dir = new THREE.Vector3();

/**
 * Relation between two moving nodes. Recomputed per frame because rapier owns
 * the node transforms; `setPoints` mutates the existing geometry instead of
 * rebuilding it, so this stays cheap.
 */
export function Connection3D({
  sourceId,
  targetId,
  color,
  strength = 1,
  animated = false,
  selected = false,
  dimmed = false,
  reducedMotion = false,
}: Connection3DProps) {
  const line = useRef<any>(null);
  const store = useNodePositionStore();

  useFrame((state) => {
    const ref = line.current;
    if (!ref) return;

    const a = nodeVector(store, sourceId);
    const b = nodeVector(store, targetId);

    // bow the curve away from the core so lines don't cut through the centre
    mid.copy(a).add(b).multiplyScalar(0.5);
    dir.copy(b).sub(a);
    mid.x += -dir.y * 0.12;
    mid.y += dir.x * 0.12;
    ref.setPoints(a, b, mid);

    const material = ref.material as THREE.Material & {
      opacity: number;
      dashOffset?: number;
    };
    // В покое связь тише: она объясняет расстановку, а не спорит с ней.
      // Прежние 0.42 делали линию заметнее сферы, к которой она ведёт.
      material.opacity = dimmed ? 0.04 : selected ? 0.9 : 0.26;
    if (animated && !reducedMotion && material.dashOffset !== undefined) {
      material.dashOffset = -state.clock.elapsedTime * 0.35;
    }
  });

  return (
    <QuadraticBezierLine
      ref={line}
      start={[0, 0, 0]}
      end={[0, 0, 0]}
      color={color}
      lineWidth={selected ? strength * 1.2 + 0.8 : strength * 0.7}
      transparent
      opacity={0.26}
      // Прозрачная линия не должна писать в буфер глубины. Отсюда и было
      // мерцание: линия писала глубину, сфера рядом — тоже, и при вращении
      // камеры порядок их отрисовки перещёлкивался кадр за кадром. Глаз
      // видел это как дрожание связи между планетами.
      //
      // Порядок задан явно: связи рисуются раньше сфер и не спорят с ними
      // за право быть впереди — иначе сортировка прозрачного решает ничью
      // заново на каждом кадре.
      depthWrite={false}
      renderOrder={-1}
      dashed={animated && !reducedMotion}
      dashScale={14}
      dashSize={0.35}
      gapSize={0.22}
      toneMapped={false}
    />
  );
}
