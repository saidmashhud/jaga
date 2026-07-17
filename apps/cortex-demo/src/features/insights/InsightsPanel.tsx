import { useMemo } from 'react';
import { iconRegistry } from '@cortex/icons';
import { statusLabels } from '@cortex/tokens';
import {
  ActivityItem,
  Badge,
  Button,
  FocusTaskCard,
  LensChip,
  Panel,
  RecommendationCard,
  ScrollableArea,
  Stack,
  Text,
} from '@cortex/ui';
import { relativeTimeLabel } from '../../lib/relative-time';
import { mockCortexService } from '../../services/mock-cortex-service';
import { useCortex } from '../../state/CortexProvider';
import styles from './InsightsPanel.module.css';

const statusBadgeVariant = {
  stable: 'positive',
  working: 'info',
  attention: 'warning',
  risk: 'danger',
  paused: 'neutral',
  decision: 'ai',
} as const;

export function InsightsPanel() {
  const { state, dispatch } = useCortex();

  const lenses = mockCortexService.getLenses();
  const focusItems = mockCortexService.getFocusItems();
  const recommendation = mockCortexService.getRecommendation();
  const scene = mockCortexService.getTimelineScene(state.timelinePointId);

  const selectedProject = state.selectedProjectId
    ? mockCortexService.getProject(state.selectedProjectId)
    : undefined;

  const allActivities = useMemo(
    () => [...state.addedActivities, ...mockCortexService.getActivities()],
    [state.addedActivities],
  );

  const remainingFocus = focusItems.filter(
    (item) => !state.completedFocusIds.includes(item.id),
  ).length;

  const selectProject = (id: string) => {
    dispatch({ type: 'select-project', id });
  };

  return (
    <div className={styles.root}>
      <ScrollableArea className={styles.scroll}>
        <Stack gap={6} className={styles.inner}>
          {selectedProject && (
            <section
              className={styles.selectedCard}
              aria-label={`Выбранный проект: ${selectedProject.title}`}
            >
              <Stack gap={2}>
                <Stack direction="horizontal" gap={2} align="center" justify="space-between">
                  <Text variant="h3">{selectedProject.title}</Text>
                  <Badge
                    variant={
                      statusBadgeVariant[
                        scene.statusOverrides[selectedProject.id] ?? selectedProject.status
                      ]
                    }
                    dot
                  >
                    {scene.statusOverrides[selectedProject.id]
                      ? statusLabels[scene.statusOverrides[selectedProject.id]!]
                      : selectedProject.statusLabel}
                  </Badge>
                </Stack>
                <Text variant="caption" color="tertiary">
                  {selectedProject.subtitle} · обновлено{' '}
                  {relativeTimeLabel(selectedProject.updatedAt)}
                </Text>
                <Text variant="body" color="secondary">
                  {selectedProject.summary}
                </Text>
                <Stack direction="horizontal" gap={2}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      dispatch(
                        state.enteredProjectId === selectedProject.id
                          ? { type: 'exit-project' }
                          : { type: 'enter-project', id: selectedProject.id },
                      )
                    }
                  >
                    {state.enteredProjectId === selectedProject.id
                      ? 'Выйти из проекта'
                      : 'Войти в проект'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dispatch({ type: 'clear-selection' })}
                  >
                    Снять выбор
                  </Button>
                </Stack>
              </Stack>
            </section>
          )}

          <Panel title="Линзы">
            <div className={styles.lenses}>
              {lenses.map((lens) => (
                <LensChip
                  key={lens.id}
                  active={state.activeLensId === lens.id}
                  onClick={() => dispatch({ type: 'set-lens', id: lens.id })}
                >
                  {lens.title}
                </LensChip>
              ))}
            </div>
          </Panel>

          <Panel
            title="Фокус сегодня"
            action={
              <Badge variant={remainingFocus > 0 ? 'warning' : 'positive'}>
                {remainingFocus > 0 ? `Осталось: ${remainingFocus}` : 'Всё сделано'}
              </Badge>
            }
          >
            {focusItems.map((item) => {
              const project = mockCortexService.getProject(item.projectId);
              if (!project) return null;
              return (
                <FocusTaskCard
                  key={item.id}
                  projectName={project.title}
                  title={item.title}
                  description={item.description}
                  impact={item.impact}
                  progress={item.progress}
                  projectColor={mockCortexService.getProjectColor(item.projectId)}
                  completed={state.completedFocusIds.includes(item.id)}
                  selected={state.selectedProjectId === item.projectId}
                  onSelect={() => selectProject(item.projectId)}
                  onToggleComplete={(completed) =>
                    dispatch({ type: 'toggle-focus-item', id: item.id, completed })
                  }
                />
              );
            })}
          </Panel>

          <Panel title="Что происходит">
            {allActivities.map((activity) => {
              const project = mockCortexService.getProject(activity.projectId);
              if (!project) return null;
              const Icon = project.icon ? iconRegistry[project.icon] : null;
              return (
                <ActivityItem
                  key={activity.id}
                  projectName={project.title}
                  title={activity.title}
                  timeLabel={relativeTimeLabel(activity.createdAt)}
                  icon={Icon ? <Icon /> : undefined}
                  projectColor={mockCortexService.getProjectColor(activity.projectId)}
                  selected={state.selectedProjectId === activity.projectId}
                  fresh={state.freshActivityId === activity.id}
                  onClick={() => selectProject(activity.projectId)}
                />
              );
            })}
          </Panel>

          <RecommendationCard
            title={recommendation.title}
            description={recommendation.description}
            reasons={recommendation.reasons}
            expanded={state.recommendationExpanded}
            onToggleExpand={() => dispatch({ type: 'toggle-recommendation' })}
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => selectProject(recommendation.projectIds[0]!)}
              >
                Показать на сцене
              </Button>
            }
          />
        </Stack>
      </ScrollableArea>
    </div>
  );
}
