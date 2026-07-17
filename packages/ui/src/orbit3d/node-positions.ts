import { createContext, useContext, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Nodes are moved by the physics solver, so connections cannot read positions
 * from props. Spheres publish their live world position here each frame and
 * connections/labels read from it — one shared mutable map, no re-renders.
 */
export type NodePositionStore = Map<string, THREE.Vector3>;

const NodePositionsContext = createContext<NodePositionStore | null>(null);

export const NodePositionsProvider = NodePositionsContext.Provider;

export function useNodePositionStore(): NodePositionStore {
  const store = useContext(NodePositionsContext);
  if (!store) {
    throw new Error('useNodePositionStore must be used inside <OrbitScene3D>');
  }
  return store;
}

export function useCreateNodePositionStore(): NodePositionStore {
  return useMemo(() => new Map<string, THREE.Vector3>(), []);
}

/** Returns the live vector for a node, creating the slot on first access. */
export function nodeVector(store: NodePositionStore, id: string): THREE.Vector3 {
  let vec = store.get(id);
  if (!vec) {
    vec = new THREE.Vector3();
    store.set(id, vec);
  }
  return vec;
}
