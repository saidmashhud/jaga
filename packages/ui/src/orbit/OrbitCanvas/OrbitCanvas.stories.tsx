import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CoffeeIcon, NetworkIcon, TagIcon } from '@cortex/icons';
import { OrbitCanvas } from './OrbitCanvas';
import { OrbitRing } from '../OrbitRing/OrbitRing';
import { OrbitConnection, connectionMidpoint } from '../OrbitConnection/OrbitConnection';
import { ConnectionLabel } from '../ConnectionLabel/ConnectionLabel';
import { ProjectNode } from '../ProjectNode/ProjectNode';
import { UserCoreNode } from '../UserCoreNode/UserCoreNode';
import { SceneGlow } from '../SceneGlow/SceneGlow';

const meta: Meta<typeof OrbitCanvas> = {
  title: 'Orbit/OrbitCanvas',
  component: OrbitCanvas,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Главная рабочая область: логическое пространство 1200×800 масштабируется под контейнер (пересчёт только на resize). Слои: фон → SVG (орбиты, связи) → HTML (подписи, свечения, узлы). Escape и клик по пустому фону снимают выбор.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrbitCanvas>;

const NODES = [
  {
    id: 'nexus',
    title: 'Nexus',
    status: 'stable' as const,
    x: 330,
    y: 250,
    icon: <NetworkIcon />,
  },
  {
    id: 'kofeynya',
    title: 'Кофейня',
    status: 'attention' as const,
    x: 320,
    y: 560,
    icon: <CoffeeIcon />,
  },
  {
    id: 'invent',
    title: 'invent.sale',
    status: 'decision' as const,
    x: 840,
    y: 580,
    icon: <TagIcon />,
  },
];

export const InteractiveScene: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string | null>(null);
    const connection = { source: NODES[1]!, target: NODES[2]! };
    const mid = connectionMidpoint(connection.source, connection.target);
    return (
      <div style={{ width: '100%', height: 600, display: 'flex' }}>
        <OrbitCanvas
          onClearSelection={() => setSelected(null)}
          svgLayer={
            <>
              <OrbitRing cx={600} cy={400} r={180} ry={150} dashed />
              <OrbitRing cx={600} cy={400} r={300} ry={240} opacity={0.5} />
              <OrbitConnection
                source={connection.source}
                target={connection.target}
                color="rgba(55, 217, 255, 0.55)"
                strength={2}
                animated
                selected={selected === 'invent' || selected === 'kofeynya'}
              />
            </>
          }
        >
          {selected && (
            <SceneGlow
              x={NODES.find((n) => n.id === selected)?.x ?? 600}
              y={NODES.find((n) => n.id === selected)?.y ?? 400}
              color="var(--color-accent-cyan)"
            />
          )}
          <ConnectionLabel x={mid.x} y={mid.y}>
            общий поставщик упаковки
          </ConnectionLabel>
          <UserCoreNode x={600} y={400} />
          {NODES.map((node) => (
            <ProjectNode
              key={node.id}
              id={node.id}
              title={node.title}
              status={node.status}
              icon={node.icon}
              x={node.x}
              y={node.y}
              selected={selected === node.id}
              onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
            />
          ))}
        </OrbitCanvas>
      </div>
    );
  },
};

export const WithoutBackdrop: Story = {
  render: () => (
    <div style={{ width: '100%', height: 400, display: 'flex' }}>
      <OrbitCanvas backdrop={false} svgLayer={<OrbitRing cx={600} cy={400} r={220} dashed />}>
        <UserCoreNode x={600} y={400} />
      </OrbitCanvas>
    </div>
  ),
};
