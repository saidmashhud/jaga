import { useCallback, useMemo, useState } from 'react';
import { iconRegistry } from '@cortex/icons';
import { statusLabels } from '@cortex/tokens';
import {
  ConnectionLabel,
  OrbitCanvas,
  OrbitConnection,
  ProjectNode,
  SceneGlow,
  UserCoreNode,
  connectionPointAt,
} from '@cortex/ui';
import { mockCortexService } from '../../services/mock-cortex-service';
import { BeltRings } from './BeltRings';
import { BELT_NAME, inBeltOrder, labelsVisible, linkCounts, sizeByLinks } from './belts';
import { useCortex } from '../../state/CortexProvider';
import type { ConnectionType } from '../../mocks/types';
import styles from './OrbitScene.module.css';

const CENTER = { x: 600, y: 400 };

/**
 * Цвета связей по видам — один словарь на приложение.
 *
 * Их было два, свой у каждой сцены, и один вид получал в них разные цвета:
 * «общая команда» была фиолетовой в одной и золотой в другой. Через токены, а
 * не значениями: тема переключается, а вписанный сюда цвет — нет.
 */
const connectionColor: Record<ConnectionType, string> = {
  team: 'var(--color-accent-violet)',
  finance: 'var(--color-state-stable)',
  dependency: 'var(--color-state-attention)',
  client: 'var(--color-state-decision)',
  resource: 'var(--color-state-working)',
  knowledge: 'var(--color-state-ai)',
};

/** Состояние по номеру пояса — нужно для подписи узла читалке. */
const BELT_STATUS = ['decision', 'risk', 'attention', 'working', 'stable', 'paused'];

export function OrbitScene() {
  const { state, dispatch } = useCortex();

  const projects = mockCortexService.getProjects();
  const connections = mockCortexService.getConnections();
  const scene = mockCortexService.getTimelineScene(state.timelinePointId);
  const lens = state.activeLensId
    ? mockCortexService.getLenses().find((l) => l.id === state.activeLensId) ?? null
    : null;

  const shape = mockCortexService.getSceneShape();
  const centre = shape?.center ?? CENTER;

  // Действующий масштаб приходит от полотна: по нему решается, показывать ли
  // подписи. Считать надо от того, насколько крупно человек ВИДИТ узел, а не
  // от того, сколько он накрутил колесом на большом экране.
  const [scale, setScale] = useState(1);
  const onScaleChange = useCallback((v: number) => setScale(v), []);

  const degree = useMemo(() => linkCounts(connections), [connections]);
  // Порядок в дереве — по поясам, а не по свежести: маршрут Tab не должен
  // перетасовываться под человеком после каждого обновления данных.
  const ordered = useMemo(() => inBeltOrder(projects, centre), [projects, centre]);
  const beltCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of projects) m.set(p.belt ?? 4, (m.get(p.belt ?? 4) ?? 0) + 1);
    return m;
  }, [projects]);

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
        aria-label="Карта дел"
        navigable
        onScaleChange={onScaleChange}
        onClearSelection={() => dispatch({ type: 'clear-selection' })}
        svgLayer={
          <>
            {/* Кольцо перестало быть украшением и стало шкалой: место узла на
                нём — это то, насколько дело требует человека. */}
            {shape && <BeltRings shape={shape} counts={beltCounts} />}
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
        {/* Ядро — начало отсчёта шкалы, а не живой объект: дыхание снято.
            Один движущийся предмет находится боковым зрением мгновенно; когда
            движется и он, и что-то ещё, оба читаются как помеха. */}
        <UserCoreNode x={centre.x} y={centre.y} pulse={false} />
        {/* Узлы — настоящий список настоящих кнопок.
            Прежде вся сцена была помечена aria-hidden, и в дереве доступности
            не было ни одного узла: карта была нема с обеих сторон. Порядок в
            списке — порядок поясов, поэтому первое, на что попадает Tab, — то,
            что требует решения. */}
        <ul className={styles.nodes}>
          {ordered.map((project) => {
            const status = scene.statusOverrides[project.id] ?? project.status;
            const statusLabel =
              scene.statusOverrides[project.id] != null
                ? statusLabels[status]
                : project.statusLabel;
            const Icon = project.icon ? iconRegistry[project.icon] : null;
            const belt = project.belt ?? 4;
            const links = degree.get(project.id) ?? 0;
            // Подпись возвращается на любом приближении, если узел под
            // курсором, выбран или это сосед активного: спрятать имя ровно у
            // того, на что человек смотрит, было бы издевательством.
            const speaks =
              labelsVisible(scale, belt) ||
              activeId === project.id ||
              Boolean(relatedIds?.has(project.id));
            return (
              <li key={project.id} className={styles.node}>
                <ProjectNode
                  id={project.id}
                  title={project.title}
                  subtitle={project.subtitle}
                  icon={Icon ? <Icon /> : undefined}
                  status={status}
                  statusLabel={statusLabel}
                  // Размер — по числу связей: радиус занят вниманием, цвет
                  // состоянием, а связность в данных уже есть.
                  size={sizeByLinks(links)}
                  beltLabel={BELT_NAME[BELT_STATUS[belt - 1] ?? 'working']}
                  beltIndex={belt}
                  beltCount={6}
                  linkCount={links}
                  quiet={!speaks}
                  guessed={project.beltGuessed}
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
              </li>
            );
          })}
        </ul>
      </OrbitCanvas>
    </div>
  );
}
