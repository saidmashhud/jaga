import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  DecisionIcon,
  FocusIcon,
  InsideIcon,
  OrbitIcon,
  SettingsIcon,
} from '@cortex/icons';
import { NavigationRail } from './NavigationRail';
import { NavigationRailItem } from '../NavigationRailItem/NavigationRailItem';

const meta: Meta<typeof NavigationRail> = {
  title: 'Navigation/NavigationRail',
  component: NavigationRail,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Левая вертикальная навигация по режимам Cortex. Стрелки ↑/↓ двигают фокус между пунктами; на компактных ширинах остаются только иконки с tooltip.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationRail>;

const items = [
  { id: 'orbit', label: 'Orbit', icon: <OrbitIcon size={20} /> },
  { id: 'focus', label: 'Focus', icon: <FocusIcon size={20} /> },
  { id: 'inside', label: 'Inside', icon: <InsideIcon size={20} /> },
  { id: 'decision', label: 'Decision', icon: <DecisionIcon size={20} />, badge: '1' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
];

export const Default: Story = {
  render: function Render() {
    const [active, setActive] = useState('orbit');
    return (
      <div style={{ height: 420, width: 76, display: 'flex' }}>
        <NavigationRail>
          {items.map((item) => (
            <NavigationRailItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={active === item.id}
              onClick={() => setActive(item.id)}
            />
          ))}
        </NavigationRail>
      </div>
    );
  },
};
