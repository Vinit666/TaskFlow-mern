import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../components/tasks/TaskCard';

describe('TaskCard Component', () => {
  const mockTask = {
    _id: 'task-123',
    title: 'Design Microservice Pipeline',
    description: 'Build Kubernetes manifests and Helm charts',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-12-31T00:00:00.000Z',
    createdAt: '2026-10-15T00:00:00.000Z'
  };

  it('renders task title, description, status, and priority badges properly', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('Design Microservice Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Build Kubernetes manifests and Helm charts')).toBeInTheDocument();
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });

  it('triggers onView, onEdit, and onDelete action callbacks when action buttons are clicked', () => {
    const handleView = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskCard
        task={mockTask}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    const viewBtn = screen.getByLabelText('View task details');
    const editBtn = screen.getByLabelText('Edit task');
    const deleteBtn = screen.getByLabelText('Delete task');

    fireEvent.click(viewBtn);
    expect(handleView).toHaveBeenCalledWith(mockTask);

    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockTask);

    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockTask);
  });

  it('advances status when quick status toggle icon is clicked', () => {
    const handleQuickChange = vi.fn();
    render(<TaskCard task={mockTask} onQuickStatusChange={handleQuickChange} />);

    const quickBtn = screen.getByTitle(/Advance status/i);
    fireEvent.click(quickBtn);

    // in-progress should advance to completed
    expect(handleQuickChange).toHaveBeenCalledWith('task-123', 'completed');
  });
});
