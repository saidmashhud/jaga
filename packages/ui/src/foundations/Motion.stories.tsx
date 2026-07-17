import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { motion } from '@cortex/tokens';
import { Button } from '../primitives/Button/Button';
import { Text } from '../primitives/Text/Text';

const meta: Meta = {
  title: 'Foundations/Motion',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Motion-токены: fast 120ms, normal 200ms, slow 360ms, scene 600ms; easing cubic-bezier(0.22, 1, 0.36, 1). Анимация объясняет изменения, а не украшает. При prefers-reduced-motion длительности схлопываются.',
      },
    },
  },
};

export default meta;

const tokens = [
  ['--motion-fast', motion.fast],
  ['--motion-normal', motion.normal],
  ['--motion-slow', motion.slow],
  ['--motion-scene', motion.scene],
] as const;

export const Durations: StoryObj = {
  render: function Render() {
    const [flipped, setFlipped] = useState(false);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 480 }}>
        <Button onClick={() => setFlipped((f) => !f)} style={{ alignSelf: 'flex-start' }}>
          Запустить переход
        </Button>
        {tokens.map(([token, ms]) => (
          <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text
              variant="caption"
              color="tertiary"
              style={{ width: 150, fontFamily: 'monospace' }}
            >
              {token} · {ms}ms
            </Text>
            <div
              style={{
                flex: 1,
                height: 22,
                borderRadius: 6,
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: flipped ? 'calc(100% - 60px)' : 3,
                  width: 56,
                  height: 14,
                  borderRadius: 4,
                  background: 'var(--color-accent-violet)',
                  transition: `left var(${token}) var(--easing-standard)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
};
