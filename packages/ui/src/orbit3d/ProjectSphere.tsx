import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { easing } from 'maath';
import type { SemanticStatus } from '@cortex/tokens';
import { nodeVector, useNodePositionStore } from './node-positions';
import { useLabelRegistry } from './label-registry';
import { nodeRadius, statusMaterial } from './scene-tokens';
import styles from './ProjectSphere.module.css';

export interface ProjectSphereProps {
  id: string;
  title: string;
  subtitle?: string;
  /** Localized status text — status must never be colour-only (§6.3). */
  statusLabel: string;
  status: SemanticStatus;
  size?: 'sm' | 'md' | 'lg';
  /** Anchor in world units — the mock layout position the sphere returns to. */
  anchor: [number, number, number];
  selected?: boolean;
  dimmed?: boolean;
  /** Recently updated — brief emissive flare. */
  updated?: boolean;
  /** Short summary shown on hover/focus. */
  hoverSummary?: string;
  icon?: ReactNode;
  reducedMotion?: boolean;
  onSelect?: (id: string) => void;
  onHoverChange?: (id: string, hovered: boolean) => void;
}

const tmpVec = new THREE.Vector3();
const tmpColor = new THREE.Color();

/**
 * Project node as a physics-driven sphere. Rapier gives it life (collisions,
 * pointer repulsion), but a spring impulse toward `anchor` keeps the mock
 * layout from §11.4 recognisable — the scene breathes without becoming random.
 *
 * The label is a drei <Html> overlay rather than 3D text: it keeps real DOM, so
 * the node stays keyboard-reachable and readable by screen readers even though
 * the scene itself is WebGL.
 */
export function ProjectSphere({
  id,
  title,
  subtitle,
  statusLabel,
  status,
  size = 'md',
  anchor,
  selected = false,
  dimmed = false,
  updated = false,
  hoverSummary,
  icon,
  reducedMotion = false,
  onSelect,
  onHoverChange,
}: ProjectSphereProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const registry = useLabelRegistry();

  const body = useRef<RapierRigidBody>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const store = useNodePositionStore();

  // Подпись отдаётся разводящему: он один видит все и решает, чью показать,
  // когда две налезают друг на друга. Сама подпись о соседях не знает.
  useEffect(() => {
    registry.set(id, { ref: labelRef, at: nodeVector(store, id), z: anchor[2], kind: 'node' });
    return () => {
      registry.delete(id);
      // Координаты живут в общей карте, которая сама себя не чистит: без этого
      // удалённый проект остаётся в ней навсегда и продолжает растягивать
      // рамку камеры на место, где давно ничего нет.
      store.delete(id);
    };
  }, [registry, store, id, anchor]);

  const radius = nodeRadius[size];
  const material = statusMaterial[status];
  const anchorVec = useMemo(() => new THREE.Vector3(...anchor), [anchor]);

  const setHover = (value: boolean) => {
    setHovered(value);
    onHoverChange?.(id, value);
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(0.1, rawDelta);
    const api = body.current;
    if (!api) return;

    const translation = api.translation();
    // publish live position for connections/labels
    nodeVector(store, id).set(translation.x, translation.y, translation.z);

    // spring back to the anchor so physics never destroys the readable layout
    tmpVec
      .set(translation.x, translation.y, translation.z)
      .sub(anchorVec)
      .multiplyScalar(-0.24 * radius);
    api.applyImpulse(tmpVec, true);

    const target = mesh.current;
    if (!target) return;
    const mat = target.material as THREE.MeshStandardMaterial;

    const focus = selected || hovered;
    const intensity = dimmed
      ? material.emissiveIntensity * 0.15
      : material.emissiveIntensity * (focus ? 1.9 : 1) + (updated ? 0.7 : 0);

    easing.damp(mat, 'emissiveIntensity', intensity, 0.25, delta);
    easing.damp(mat, 'opacity', dimmed ? 0.32 : 1, 0.25, delta);
    easing.damp3(target.scale, focus ? 1.12 : 1, 0.2, delta);
    easing.dampC(mat.color, tmpColor.set(material.color), 0.25, delta);
  });

  return (
    <RigidBody
      ref={body}
      position={anchor}
      colliders={false}
      linearDamping={3.4}
      angularDamping={1.4}
      friction={0.1}
    >
      <BallCollider args={[radius]} />
      <mesh
        ref={mesh}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial
          color={material.color}
          emissive={material.emissive}
          emissiveIntensity={material.emissiveIntensity}
          roughness={material.roughness}
          metalness={material.metalness}
          transparent
        />
      </mesh>

      <Html
        position={[0, -radius - 0.28, 0]}
        center
        distanceFactor={9}
        zIndexRange={[20, 0]}
        // labels must not eat scene pointer events except on the button itself
        style={{ pointerEvents: 'none' }}
      >
        <div
          // Ссылка именно на подпись, а не на обёртку drei: разводящий мерит
          // её место на экране и на ней же ставит признак тесноты — на том же
          // элементе, к которому привязаны правила вида.
          ref={labelRef}
          className={`${styles.label} ${dimmed ? styles.dimmed : ''} ${
            reducedMotion ? styles.noMotion : ''
          }`}
          data-status={status}
        >
          <button
            type="button"
            className={styles.hit}
            aria-pressed={selected}
            aria-label={`${title}. ${statusLabel}`}
            onClick={() => onSelect?.(id)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
          >
            {icon && (
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
            )}
            <span className={styles.title}>{title}</span>
          </button>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          <span className={styles.status}>{statusLabel}</span>
          {updated && <span className={styles.updated}>обновлено</span>}
          {hoverSummary && (hovered || selected) && (
            <span role="tooltip" className={styles.tooltip}>
              {hoverSummary}
            </span>
          )}
        </div>
      </Html>
    </RigidBody>
  );
}
