import { useMemo } from 'react';
import { iconRegistry } from '@cortex/icons';
import { rawColors, statusLabels } from '@cortex/tokens';
import {
  Connection3D,
  ConnectionLabel3D,
  OrbitRing3D,
  OrbitScene3D,
  PortalCard,
  InsightPanel3D,
  ProjectSphere,
  UserCore3D,
  connectionColor3d,
  toWorld,
  type EffectQuality,
} from '@cortex/ui/orbit3d';
import { mockCortexService } from '../../services/mock-cortex-service';
import { useCortex } from '../../state/CortexProvider';
import styles from './OrbitScene3DView.module.css';

export interface OrbitScene3DViewProps {
  quality: EffectQuality;
  dpr: [number, number];
  reducedMotion: boolean;
}

/** Accent colour of a project as a raw hex (WebGL cannot read CSS vars). */
const projectHex: Record<string, string> = {
  nexus: rawColors.stateStable,
  metan: rawColors.statePaused,
  didi: rawColors.stateRisk,
  kofeynya: rawColors.stateAttention,
  freelance: rawColors.stateWorking,
  'invent-sale': rawColors.stateDecision,
};

export function OrbitScene3DView({
  quality,
  dpr,
  reducedMotion,
}: OrbitScene3DViewProps) {
  const { state, dispatch } = useCortex();

  const projects = mockCortexService.getProjects();
  const connections = mockCortexService.getConnections();
  const scene = mockCortexService.getTimelineScene(state.timelinePointId);
  const focusItems = mockCortexService.getFocusItems();
  const lens = state.activeLensId
    ? (mockCortexService.getLenses().find((l) => l.id === state.activeLensId) ?? null)
    : null;

  const activeId = state.hoveredProjectId ?? state.selectedProjectId;

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
    if (state.enteredProjectId) return projectId !== state.enteredProjectId;
    if (lensIds && !lensIds.has(projectId)) return true;
    if (state.hoveredProjectId && relatedIds && !relatedIds.has(projectId)) return true;
    return false;
  };

  const freshEvent = state.freshActivityId
    ? (state.addedActivities.find((a) => a.id === state.freshActivityId) ?? null)
    : null;

  const enteredProject = state.enteredProjectId
    ? mockCortexService.getProject(state.enteredProjectId)
    : undefined;

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

      <OrbitScene3D
        quality={quality}
        dpr={dpr}
        reducedMotion={reducedMotion}
        // let the camera settle for inspection once something is in focus
        autoRotate={!state.selectedProjectId && !state.enteredProjectId}
        onClearSelection={() => dispatch({ type: 'clear-selection' })}
        className={styles.canvas}
      >
        {/* rings sit on different planes so the orbits form a volume, not a stack */}
        <OrbitRing3D
          radius={4.2}
          tilt={[Math.PI / 2, 0, 0]}
          reducedMotion={reducedMotion}
        />
        <OrbitRing3D
          radius={6.6}
          tilt={[Math.PI / 2.35, 0.4, 0]}
          opacity={0.08}
          spin={-0.014}
          reducedMotion={reducedMotion}
        />
        <OrbitRing3D
          radius={9.1}
          tilt={[Math.PI / 1.8, -0.35, 0.25]}
          opacity={0.05}
          spin={0.008}
          reducedMotion={reducedMotion}
        />

        <UserCore3D pulse={!state.selectedProjectId} reducedMotion={reducedMotion} />

        {connections.map((connection) => {
          const touchesActive =
            activeId != null &&
            (connection.sourceId === activeId || connection.targetId === activeId);
          const dimmed =
            Boolean(state.enteredProjectId) ||
            (lensIds != null &&
              !(lensIds.has(connection.sourceId) && lensIds.has(connection.targetId)) &&
              !touchesActive) ||
            (activeId != null && !touchesActive);
          return (
            <Connection3D
              key={connection.id}
              sourceId={connection.sourceId}
              targetId={connection.targetId}
              color={connectionColor3d[connection.type] ?? rawColors.textSecondary}
              strength={connection.strength}
              animated={connection.animated}
              selected={touchesActive}
              dimmed={dimmed}
              reducedMotion={reducedMotion}
            />
          );
        })}

        {connections.map((connection) => {
          if (!connection.label) return null;
          const touchesActive =
            activeId != null &&
            (connection.sourceId === activeId || connection.targetId === activeId);
          const dimmed =
            Boolean(state.enteredProjectId) ||
            (lensIds != null &&
              !(lensIds.has(connection.sourceId) && lensIds.has(connection.targetId)) &&
              !touchesActive) ||
            (activeId != null && !touchesActive);
          return (
            <ConnectionLabel3D
              key={`label-${connection.id}`}
              sourceId={connection.sourceId}
              targetId={connection.targetId}
              t={connection.labelT ?? 0.5}
              dimmed={dimmed}
              emphasized={touchesActive}
            >
              {connection.label}
            </ConnectionLabel3D>
          );
        })}

        {projects.map((project) => {
          const status = scene.statusOverrides[project.id] ?? project.status;
          const statusLabel =
            scene.statusOverrides[project.id] != null
              ? statusLabels[status]
              : project.statusLabel;
          const Icon = project.icon ? iconRegistry[project.icon] : null;
          return (
            <ProjectSphere
              key={project.id}
              id={project.id}
              title={project.title}
              subtitle={project.subtitle}
              statusLabel={statusLabel}
              status={status}
              size={project.size}
              anchor={toWorld(project.position)}
              icon={Icon ? <Icon /> : undefined}
              selected={state.selectedProjectId === project.id}
              dimmed={isDimmed(project.id)}
              updated={freshEvent?.projectId === project.id}
              hoverSummary={project.summary}
              reducedMotion={reducedMotion}
              onSelect={(id) => dispatch({ type: 'toggle-project', id })}
              onHoverChange={(id, hovered) =>
                dispatch({ type: 'hover-project', id: hovered ? id : null })
              }
            />
          );
        })}

        {/* Depth level 2 (§6.2): the entered project opens as a portal world */}
        {enteredProject && (
          <PortalCard
            id={enteredProject.id}
            title={enteredProject.title}
            caption={enteredProject.subtitle}
            bg="#080d1c"
            open
            position={[0, 0, 6]}
            width={9}
            height={5.6}
            reducedMotion={reducedMotion}
          >
            <UserCore3D reducedMotion={reducedMotion} />
            {focusItems
              .filter((item) => item.projectId === enteredProject.id)
              .map((item, index) => (
                <InsightPanel3D
                  key={item.id}
                  label={item.title}
                  accent={projectHex[enteredProject.id] ?? rawColors.accentBlue}
                  position={[-0.9, 0.7 - index * 0.85, 1.6]}
                  rotation={[0, 0.28, 0]}
                  floatSeed={index * 1.7}
                  reducedMotion={reducedMotion}
                />
              ))}
            <InsightPanel3D
              label={enteredProject.summary.slice(0, 70)}
              accent={rawColors.stateAi}
              position={[1.1, -0.6, 1.2]}
              rotation={[0, -0.3, 0]}
              floatSeed={3.2}
              reducedMotion={reducedMotion}
            />
          </PortalCard>
        )}
      </OrbitScene3D>

      {enteredProject && (
        <button
          type="button"
          className={styles.exitPortal}
          onClick={() => dispatch({ type: 'exit-project' })}
        >
          ← Выйти из проекта «{enteredProject.title}»
        </button>
      )}
    </div>
  );
}
