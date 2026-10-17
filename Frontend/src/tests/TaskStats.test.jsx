import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskStats from '../components/tasks/TaskStats';

describe('TaskStats Component', () => {
  const mockStats = {
    total: 15,
    pending: 7,
    'in-progress': 5,
    completed: 3
  };

  it('renders all metrics values and labels properly', () => {
    render(<TaskStats stats={mockStats} activeFilter="all" />);

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('invokes onSelectFilter callback when a stat card is clicked', () => {
    const handleSelect = vi.fn();
    render(<TaskStats stats={mockStats} activeFilter="all" onSelectFilter={handleSelect} />);

    const completedCard = screen.getByText('Completed').closest('.stat-card');
    fireEvent.click(completedCard);

    expect(handleSelect).toHaveBeenCalledWith('completed');
  });
});
