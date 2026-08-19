import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { MeshPortalMaterial, RoundedBox, Text } from '@react-three/drei';
import { easing, geometry } from 'maath';
import { sceneColors } from './scene-tokens';

// roundedPlaneGeometry — the border-radius trick from the pmndrs cards demo
extend(geometry);

declare module '@react-three/fiber' {
  interface ThreeElements {
    roundedPlaneGeometry: any;
  }
}

export interface PortalCardProps {
  /** Stable id; matches the project the portal belongs to. */
  id: string;
  title: string;
  /** Small caption in the corner of the frame. */
  caption?: string;
  /** Background colour of the world behind the portal. */
  bg?: string;
  /** 0 → closed (a card), 1 → fully entered (the inner world fills the view). */
  open: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  reducedMotion?: boolean;
  onEnter?: (id: string) => void;
  /** Contents of the world inside the portal. */
  children?: ReactNode;
}

/**
 * A rounded card whose surface is a window into a separate scene
 * (drei MeshPortalMaterial). Blending to 1 walks the camera through the frame,
 * which is how «портфель → проект» depth works without a page transition.
 */
export function PortalCard({
  id,
  title,
  caption,
  bg = '#0b0b0d',
  open,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 2.1,
  height = 2.1 * 1.618,
  reducedMotion = false,
  onEnter,
  children,
}: PortalCardProps) {
  const portal = useRef<any>(null);

  useFrame((_, delta) => {
    if (!portal.current) return;
    const target = open ? 1 : 0;
    if (reducedMotion) {
      portal.current.blend = target;
      return;
    }
    easing.damp(portal.current, 'blend', target, 0.22, Math.min(0.1, delta));
  });

  return (
    <group position={position} rotation={rotation}>
      <Text
        fontSize={0.22}
        anchorX="left"
        anchorY="top"
        position={[-width / 2 + 0.12, height / 2 - 0.12, 0.01]}
        color={sceneColors.textPrimary}
        material-toneMapped={false}
      >
        {title}
      </Text>
      {caption && (
        <Text
          fontSize={0.1}
          anchorX="right"
          anchorY="bottom"
          position={[width / 2 - 0.12, -height / 2 + 0.12, 0.01]}
          color={sceneColors.textSecondary}
          material-toneMapped={false}
        >
          {caption}
        </Text>
      )}
      <mesh
        name={id}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onEnter?.(id);
        }}
      >
        <roundedPlaneGeometry args={[width, height, 0.12]} />
        <MeshPortalMaterial ref={portal} events={open} side={THREE.DoubleSide}>
          <color attach="background" args={[bg]} />
          <ambientLight intensity={0.6} />
          <pointLight position={[2, 3, 4]} intensity={12} decay={2} />
          {children}
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
}

/** Rounded 3D panel used for the cards floating inside a portal world. */
export function InsightPanel3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#131d32',
  accent,
  label,
  reducedMotion = false,
  floatSeed = 0,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  accent: string;
  label: string;
  reducedMotion?: boolean;
  floatSeed?: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (reducedMotion || !group.current) return;
    const t = state.clock.elapsedTime + floatSeed;
    group.current.position.y = position[1] + Math.sin(t * 0.9) * 0.05;
    group.current.rotation.z = rotation[2] + Math.sin(t * 0.6) * 0.02;
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <RoundedBox args={[1.5, 0.62, 0.05]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
      </RoundedBox>
      {/* semantic accent line — same idea as FocusTaskCard in the DOM system */}
      <mesh position={[-0.72, 0, 0.03]}>
        <boxGeometry args={[0.03, 0.5, 0.02]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <Text
        fontSize={0.088}
        maxWidth={1.2}
        anchorX="left"
        position={[-0.62, 0, 0.04]}
        color={sceneColors.textPrimary}
        material-toneMapped={false}
      >
        {label}
      </Text>
    </group>
  );
}
