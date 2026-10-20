import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskFormModal from '../components/tasks/TaskFormModal';

describe('TaskFormModal Component', () => {
  it('renders title, description, status, priority, and due date inputs', () => {
    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
  });

  it('allows clicking and typing into input fields without closing or resetting', () => {
    const handleClose = vi.fn();
    render(
      <TaskFormModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/Task Title/i);
    const descInput = screen.getByLabelText(/Description/i);

    // Click/focus inputs
    fireEvent.click(titleInput);
    fireEvent.change(titleInput, { target: { value: 'New Test Task Title' } });

    fireEvent.click(descInput);
    fireEvent.change(descInput, { target: { value: 'Detailed task description notes' } });

    expect(titleInput.value).toBe('New Test Task Title');
    expect(descInput.value).toBe('Detailed task description notes');
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('submits form with correct data when Save is clicked', async () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <TaskFormModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Task Title/i), {
      target: { value: 'Build GraphQL API' }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Create schema definitions' }
    });

    const submitBtn = screen.getByRole('button', { name: /Create Task/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'Build GraphQL API',
      description: 'Create schema definitions',
      status: 'pending',
      priority: 'medium',
      dueDate: null
    });
  });

  it('initializes edit mode with initialData properly', () => {
    const initialData = {
      _id: 'task-123',
      title: 'Existing Task to Edit',
      description: 'Original description',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2026-12-31T00:00:00.000Z'
    };

    render(
      <TaskFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={initialData}
      />
    );

    expect(screen.getByDisplayValue('Existing Task to Edit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument();
  });

  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();

    render(
      <TaskFormModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
