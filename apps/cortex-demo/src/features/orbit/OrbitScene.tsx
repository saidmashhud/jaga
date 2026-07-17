import { useMemo } from 'react';
import { iconRegistry } from '@cortex/icons';
import { statusLabels } from '@cortex/tokens';
import {
  ConnectionLabel,
  OrbitCanvas,
  OrbitConnection,
  OrbitRing,
  ProjectNode,
  SceneGlow,
  UserCoreNode,
  connectionPointAt,
} from '@cortex/ui';
import { mockCortexService } from '../../services/mock-cortex-service';
import { useCortex } from '../../state/CortexProvider';
import type { ConnectionType } from '../../mocks/types';
import styles from './OrbitScene.module.css';

const CENTER = { x: 600, y: 400 };

const connectionColor: Record<ConnectionType, string> = {
  team: 'rgba(155, 123, 255, 0.55)',
  finance: 'rgba(117, 237, 111, 0.5)',
  dependency: 'rgba(255, 201, 74, 0.5)',
  client: 'rgba(55, 217, 255, 0.55)',
  resource: 'rgba(53, 151, 255, 0.5)',
  knowledge: 'rgba(118, 87, 255, 0.5)',
};

export function OrbitScene() {
  const { state, dispatch } = useCortex();

  const projects = mockCortexService.getProjects();
  const connections = mockCortexService.getConnections();
  const scene = mockCortexService.getTimelineScene(state.timelinePointId);
  const lens = state.activeLensId
    ? mockCortexService.getLenses().find((l) => l.id === state.activeLensId) ?? null
    : null;

  const activeId = state.hoveredProjectId ?? state.selectedProjectId;

  /** ids connected to the active (hovered/selected) node, incl. itself */
  const relatedIds = useMemo(() => {
    if (!activeId) return null;
    const ids = new Set([activeId]);
    for (const c of connections) {
      if (c.sourceId === activeId) ids.add(c.targetId);
      if (c.targetId === activeId) ids.add(c.sourceId);
    }
    return ids;
  }, [activeId, connections]);

  const lensIds = lens ? new Set(lens.projectIds) : null;

  const isDimmed = (projectId: string): boolean => {
    if (lensIds && !lensIds.has(projectId)) return true;
    if (state.hoveredProjectId && relatedIds && !relatedIds.has(projectId)) return true;
    return false;
  };

  const selectedProject = state.selectedProjectId
    ? projects.find((p) => p.id === state.selectedProjectId) ?? null
    : null;

  const freshEvent = state.freshActivityId
    ? state.addedActivities.find((a) => a.id === state.freshActivityId) ?? null
    : null;

  const hintText = lens
    ? lens.explanation
    : state.timelinePointId !== 'now'
      ? scene.hint
      : null;

  return (
    <div className={styles.root}>
      {hintText && (
        <div className={styles.hint} role="status">
          <span>{hintText}</span>
          {lens && (
            <button
              type="button"
              className={styles.hintReset}
              onClick={() => dispatch({ type: 'set-lens', id: lens.id })}
            >
              Сбросить
            </button>
          )}
        </div>
      )}
      <OrbitCanvas
        aria-label="Карта проектов Orbit"
        onClearSelection={() => dispatch({ type: 'clear-selection' })}
        svgLayer={
          <>
            <OrbitRing cx={CENTER.x} cy={CENTER.y} r={175} ry={150} dashed opacity={0.8} />
            <OrbitRing cx={CENTER.x} cy={CENTER.y} r={300} ry={245} opacity={0.55} />
            <OrbitRing cx={CENTER.x} cy={CENTER.y} r={430} ry={330} dashed opacity={0.35} />
            {connections.map((connection) => {
              const source = projects.find((p) => p.id === connection.sourceId);
              const target = projects.find((p) => p.id === connection.targetId);
              if (!source || !target) return null;
              const touchesActive =
                activeId != null &&
                (connection.sourceId === activeId || connection.targetId === activeId);
              const dimmed =
                (lensIds &&
                  !(lensIds.has(connection.sourceId) && lensIds.has(connection.targetId)) &&
                  !touchesActive) ||
                (activeId != null && !touchesActive);
              return (
                <OrbitConnection
                  key={connection.id}
                  source={source.position}
                  target={target.position}
                  color={connectionColor[connection.type]}
                  strength={connection.strength}
                  animated={connection.animated}
                  selected={touchesActive}
                  dimmed={Boolean(dimmed)}
                />
              );
            })}
          </>
        }
      >
        {selectedProject && (
          <SceneGlow
            x={selectedProject.position.x}
            y={selectedProject.position.y}
            size={340}
            color={mockCortexService.getProjectColor(selectedProject.id)}
          />
        )}
        {connections.map((connection) => {
          if (!connection.label) return null;
          const source = projects.find((p) => p.id === connection.sourceId);
          const target = projects.find((p) => p.id === connection.targetId);
          if (!source || !target) return null;
          const mid = connectionPointAt(
            source.position,
            target.position,
            connection.labelT ?? 0.5,
          );
          const touchesActive =
            activeId != null &&
            (connection.sourceId === activeId || connection.targetId === activeId);
          const dimmed =
            (lensIds &&
              !(lensIds.has(connection.sourceId) && lensIds.has(connection.targetId)) &&
              !touchesActive) ||
            (activeId != null && !touchesActive);
          return (
            <ConnectionLabel
              key={`label-${connection.id}`}
              x={mid.x}
              y={mid.y}
              dimmed={Boolean(dimmed)}
              emphasized={touchesActive}
              className={styles.connectionLabel}
            >
              {connection.label}
            </ConnectionLabel>
          );
        })}
        <UserCoreNode x={CENTER.x} y={CENTER.y} pulse={!state.selectedProjectId} />
        {projects.map((project) => {
          const status = scene.statusOverrides[project.id] ?? project.status;
          const statusLabel =
            scene.statusOverrides[project.id] != null
              ? statusLabels[status]
              : project.statusLabel;
          const Icon = project.icon ? iconRegistry[project.icon] : null;
          return (
            <ProjectNode
              key={project.id}
              id={project.id}
              title={project.title}
              subtitle={project.subtitle}
              icon={Icon ? <Icon /> : undefined}
              status={status}
              statusLabel={statusLabel}
              size={project.size}
              x={project.position.x}
              y={project.position.y}
              selected={state.selectedProjectId === project.id}
              dimmed={isDimmed(project.id)}
              updated={freshEvent?.projectId === project.id}
              hoverSummary={project.summary}
              onSelect={(id) => dispatch({ type: 'toggle-project', id })}
              onHoverChange={(id, hovered) =>
                dispatch({ type: 'hover-project', id: hovered ? id : null })
              }
            />
          );
        })}
      </OrbitCanvas>
    </div>
  );
}
