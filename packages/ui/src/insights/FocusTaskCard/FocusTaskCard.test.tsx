import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FocusTaskCard } from './FocusTaskCard';

const baseProps = {
  projectName: 'invent.sale',
  title: 'Утвердить формат пилота',
  impact: 'high' as const,
  projectColor: 'var(--color-state-decision)',
};

describe('FocusTaskCard', () => {
  it('клик по телу карточки вызывает onSelect', async () => {
    const onSelect = vi.fn();
    render(<FocusTaskCard {...baseProps} onSelect={onSelect} />);
    await userEvent.click(
      screen.getByRole('button', { name: /Утвердить формат пилота/ }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('checkbox завершает действие и не выбирает проект', async () => {
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    render(
      <FocusTaskCard {...baseProps} onSelect={onSelect} onToggleComplete={onToggle} />,
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Завершить: Утвердить формат пилота' }),
    );
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('completed показывает отмеченный checkbox', () => {
    render(<FocusTaskCard {...baseProps} completed />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('показывает уровень эффекта текстом', () => {
    render(<FocusTaskCard {...baseProps} impact="medium" />);
    expect(screen.getByText('Средний эффект')).toBeInTheDocument();
  });

  it('прогресс отображается доступным progressbar', () => {
    render(<FocusTaskCard {...baseProps} progress={40} />);
    expect(screen.getByRole('progressbar', { name: 'Прогресс: 40%' })).toBeInTheDocument();
  });
});
