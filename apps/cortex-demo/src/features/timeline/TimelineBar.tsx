import { Timeline, TimelineEvent, type TimelinePeriod } from '@cortex/ui';
import { mockCortexService } from '../../services/mock-cortex-service';
import { useCortex } from '../../state/CortexProvider';
import type { TimelinePointId } from '../../mocks/types';
import styles from './TimelineBar.module.css';

/** Track windows: week shows the central slice of the full range. */
const periodWindow: Record<TimelinePeriod, { min: number; max: number; pointIds: TimelinePointId[] }> = {
  week: { min: 25, max: 75, pointIds: ['week-ago', 'now', 'week-ahead'] },
  month: {
    min: 0,
    max: 100,
    pointIds: ['month-ago', 'week-ago', 'now', 'week-ahead', 'month-ahead'],
  },
};

export function TimelineBar() {
  const { state, dispatch } = useCortex();
  const window = periodWindow[state.timelinePeriod];

  const points = mockCortexService
    .getTimelinePoints()
    .filter((p) => window.pointIds.includes(p.id));

  const events = mockCortexService
    .getTimelineEvents()
    .filter((e) => e.position >= window.min && e.position <= window.max);

  const rescale = (position: number) =>
    ((position - window.min) / (window.max - window.min)) * 100;

  const handlePeriodChange = (period: TimelinePeriod) => {
    dispatch({ type: 'set-timeline-period', period });
    if (!periodWindow[period].pointIds.includes(state.timelinePointId)) {
      dispatch({ type: 'set-timeline-point', id: 'now' });
    }
  };

  return (
    <div className={styles.root}>
      <Timeline
        points={points}
        activeId={state.timelinePointId}
        nowId="now"
        onSelect={(id) => dispatch({ type: 'set-timeline-point', id: id as TimelinePointId })}
        period={state.timelinePeriod}
        onPeriodChange={handlePeriodChange}
      >
        {events.map((event) => (
          <TimelineEvent
            key={event.id}
            position={rescale(event.position)}
            label={event.label}
            type={event.type}
            intensity={event.intensity}
            future={event.future}
            selected={state.selectedProjectId === event.projectId}
          />
        ))}
      </Timeline>
    </div>
  );
}
