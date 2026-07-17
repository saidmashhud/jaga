import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Timeline, type TimelinePeriod } from './Timeline';
import { TimelineEvent } from '../TimelineEvent/TimelineEvent';

const meta: Meta<typeof Timeline> = {
  title: 'Timeline/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Временная линия внизу рабочей области: точки прошлого/будущего, маркер «Сейчас», события на треке, селектор периода. Стрелки ←/→ двигают выбор. Смена точки меняет моковое состояние сцены.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

const points = [
  { id: 'week-ago', label: 'Неделя назад' },
  { id: 'now', label: 'Сейчас' },
  { id: 'week-ahead', label: 'Через неделю', future: true },
];

export const Default: Story = {
  render: function Render() {
    const [active, setActive] = useState('now');
    const [period, setPeriod] = useState<TimelinePeriod>('week');
    return (
      <div style={{ width: 720 }}>
        <Timeline
          points={points}
          activeId={active}
          nowId="now"
          onSelect={setActive}
          period={period}
          onPeriodChange={setPeriod}
        >
          <TimelineEvent position={18} label="Didi — срыв сроков подрядчика" type="risk" intensity={3} />
          <TimelineEvent position={44} label="Nexus — релиз отложен" type="update" />
          <TimelineEvent
            position={66}
            label="invent.sale — дедлайн решения"
            type="decision"
            intensity={3}
            future
          />
        </Timeline>
      </div>
    );
  },
};

export const PastSelected: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      <Timeline points={points} activeId="week-ago" nowId="now" />
    </div>
  ),
};

export const FutureSelected: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      <Timeline points={points} activeId="week-ahead" nowId="now" />
    </div>
  ),
};

export const WithoutPeriodSelector: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      <Timeline points={points} activeId="now" nowId="now" />
    </div>
  ),
};
