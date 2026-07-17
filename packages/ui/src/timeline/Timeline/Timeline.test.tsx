import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Timeline } from './Timeline';

const points = [
  { id: 'week-ago', label: 'Неделя назад' },
  { id: 'now', label: 'Сейчас' },
  { id: 'week-ahead', label: 'Через неделю', future: true },
];

describe('Timeline', () => {
  it('рендерит точки и помечает активную', () => {
    render(<Timeline points={points} activeId="now" nowId="now" />);
    expect(screen.getByRole('button', { name: 'Сейчас' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Неделя назад' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('клик по точке переключает состояние', async () => {
    const onSelect = vi.fn();
    render(<Timeline points={points} activeId="now" nowId="now" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Через неделю' }));
    expect(onSelect).toHaveBeenCalledWith('week-ahead');
  });

  it('стрелки ←/→ двигают выбор', async () => {
    const onSelect = vi.fn();
    render(<Timeline points={points} activeId="now" nowId="now" onSelect={onSelect} />);
    screen.getByRole('button', { name: 'Сейчас' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenCalledWith('week-ahead');
    await userEvent.keyboard('{ArrowLeft}');
    expect(onSelect).toHaveBeenCalledWith('week-ago');
  });

  it('переключает период', async () => {
    const onPeriodChange = vi.fn();
    render(
      <Timeline
        points={points}
        activeId="now"
        nowId="now"
        period="week"
        onPeriodChange={onPeriodChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Месяц' }));
    expect(onPeriodChange).toHaveBeenCalledWith('month');
  });
});
