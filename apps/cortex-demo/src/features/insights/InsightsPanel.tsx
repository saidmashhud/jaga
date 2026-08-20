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
import { dataSource, isLive, mockCortexService } from '../../services/mock-cortex-service';
import { ProjectLinks } from '../connections/ProjectLinks';
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

  // Гейт по явному источнику данных, а не по isLive(): тот отвечает на другой
  // вопрос — «есть ли что показать» — и живое, но пустое пространство объявляет
  // образцом. Кнопка связи пряталась бы ровно тогда, когда она нужнее всего.
  const live = dataSource() === 'live';
  const projectCount = mockCortexService.getProjects().length;

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
                  {/* Единственный вход в форму связи: здесь первый её конец уже
                      известен — им становится выбранный узел. */}
                  {live && projectCount >= 2 && state.enteredProjectId !== selectedProject.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dispatch({ type: 'open-link', sourceId: selectedProject.id })}
                    >
                      Связать с другим
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dispatch({ type: 'clear-selection' })}
                  >
                    Снять выбор
                  </Button>
                </Stack>

                {live && projectCount === 1 && (
                  <Stack gap={2} align="start">
                    <Text variant="caption" color="tertiary">
                      Связывать пока не с чем: связь живёт между двумя делами, а у вас одно.
                    </Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dispatch({ type: 'open-new-project' })}
                    >
                      Завести проект
                    </Button>
                  </Stack>
                )}

                <ProjectLinks projectId={selectedProject.id} editable={live} />
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
                  onToggleComplete={(completed) => {
                    dispatch({ type: 'toggle-focus-item', id: item.id, completed });
                    // Галочка жила только в памяти страницы: перезагрузка
                    // возвращала все отмеченные дела как несделанные. Отметка
                    // — это факт о работе, а не настройка вида, и ей место в
                    // базе. Отказ не выдаём за успех: при мёртвой сессии
                    // возвращаемся ко входу, при прочем — снимаем галочку
                    // обратно, чтобы экран не расходился с базой.
                    //
                    // На образце сохранять некуда и незачем: без этой ветки
                    // отказ вымышленной службы откатывал живую галочку.
                    if (!isLive()) return;
                    void fetch(`/v1/focus/${encodeURIComponent(item.id)}/done`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ done: completed }),
                    })
                      .then((r) => {
                        if (r.status === 401) window.location.reload();
                        else if (!r.ok)
                          dispatch({ type: 'toggle-focus-item', id: item.id, completed: !completed });
                      })
                      .catch(() =>
                        dispatch({ type: 'toggle-focus-item', id: item.id, completed: !completed }),
                      );
                  }}
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

          {/* Брифа нет — блока нет. Выдуманный совет хуже пустого
              места: прежняя рекомендация была вшита в моки и
              предлагала чужой проект даже в пустом пространстве. */}
          {recommendation && (
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
          )}
        </Stack>
      </ScrollableArea>
    </div>
  );
}
