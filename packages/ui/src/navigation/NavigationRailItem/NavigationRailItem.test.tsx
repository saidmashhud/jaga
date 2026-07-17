import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrbitIcon } from '@cortex/icons';
import { NavigationRailItem } from './NavigationRailItem';

describe('NavigationRailItem', () => {
  it('рендерит подпись и реагирует на клик', async () => {
    const onClick = vi.fn();
    render(<NavigationRailItem icon={<OrbitIcon />} label="Orbit" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: /Orbit/ }));
    expect(onClick).toHaveBeenCalled();
  });

  it('active помечается aria-current=page', () => {
    render(<NavigationRailItem icon={<OrbitIcon />} label="Orbit" active />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'page');
  });

  it('показывает badge', () => {
    render(<NavigationRailItem icon={<OrbitIcon />} label="Decision" badge="1" />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('disabled блокирует кнопку', () => {
    render(<NavigationRailItem icon={<OrbitIcon />} label="Focus" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
