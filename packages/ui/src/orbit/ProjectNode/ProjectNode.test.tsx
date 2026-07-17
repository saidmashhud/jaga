import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectNode } from './ProjectNode';

const baseProps = {
  id: 'didi',
  title: 'Didi',
  status: 'risk' as const,
  x: 100,
  y: 100,
};

describe('ProjectNode', () => {
  it('даёт доступное имя из названия и статуса', () => {
    render(<ProjectNode {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Didi. Риск' })).toBeInTheDocument();
  });

  it('выбирается мышью', async () => {
    const onSelect = vi.fn();
    render(<ProjectNode {...baseProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('didi');
  });

  it('выбирается клавиатурой (Enter)', async () => {
    const onSelect = vi.fn();
    render(<ProjectNode {...baseProps} onSelect={onSelect} />);
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('didi');
  });

  it('selected выражается через aria-pressed', () => {
    render(<ProjectNode {...baseProps} selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('кастомный statusLabel попадает в имя и подпись', () => {
    render(<ProjectNode {...baseProps} statusLabel="Срыв сроков" />);
    expect(screen.getByRole('button', { name: 'Didi. Срыв сроков' })).toBeInTheDocument();
  });

  it('hoverSummary доступен как tooltip через aria-describedby', () => {
    render(<ProjectNode {...baseProps} hoverSummary="Краткое состояние" />);
    const button = screen.getByRole('button');
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Краткое состояние');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
  });
});
