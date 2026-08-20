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
    expect(screen.getByRole('button', { name: 'Didi. Риск.' })).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Didi. Срыв сроков.' })).toBeInTheDocument();
  });

  it('hoverSummary доступен как tooltip через aria-describedby', () => {
    render(<ProjectNode {...baseProps} hoverSummary="Краткое состояние" />);
    const button = screen.getByRole('button');
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Краткое состояние');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('называет кольцо и число связей — карта говорит и тому, кто её не видит', () => {
    // Расстояние от ядра — главное, что сообщает карта. Тот, кто смотрит
    // глазами, читает его одним взглядом; тот, кто слушает, обязан услышать.
    render(
      <ProjectNode id="didi" title="Didi" status="risk" x={0} y={0} beltIndex={2} beltCount={6} linkCount={3} />,
    );
    const b = screen.getByRole('button', { name: /Didi\. Риск\. Кольцо 2 из 6\. Связей: 3\./ });
    expect(b).toBeInTheDocument();
  });

  it('ближайшее кольцо называется словом, а не номером', () => {
    render(
      <ProjectNode id="a" title="A" status="decision" x={0} y={0} beltIndex={1} beltCount={6} linkCount={0} />,
    );
    expect(screen.getByRole('button', { name: /Ближайшее кольцо из 6\./ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Связей нет\./ })).toBeInTheDocument();
  });

  it('без сведений о кольце имя остаётся прежним', () => {
    // Узел живёт и в карточных местах, где колец нет вовсе: там имя не должно
    // обрастать словами про то, чего на экране не существует.
    render(<ProjectNode id="b" title="B" status="stable" x={0} y={0} />);
    expect(screen.getByRole('button', { name: 'B. Стабильно.' })).toBeInTheDocument();
  });
});
