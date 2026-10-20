import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export const TaskFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false
}) => {
  const isEditing = Boolean(initialData && initialData._id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: ''
  });

  const [errors, setErrors] = useState({});

  const parseSafeDate = (d) => {
    if (!d) return '';
    try {
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const prevIsOpenRef = React.useRef(false);
  const prevTaskIdRef = React.useRef(null);

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const taskChanged = (initialData?._id || null) !== prevTaskIdRef.current;

    if (isOpen && (isOpening || taskChanged)) {
      if (initialData && initialData._id) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          status: initialData.status || 'pending',
          priority: initialData.priority || 'medium',
          dueDate: parseSafeDate(initialData.dueDate)
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          dueDate: ''
        });
      }
      setErrors({});
    }

    prevIsOpenRef.current = isOpen;
    prevTaskIdRef.current = initialData?._id || null;
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title || formData.title.trim() === '') {
      errs.title = 'Title is required';
    } else if (formData.title.trim().length > 150) {
      errs.title = 'Title cannot exceed 150 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        title: formData.title.trim(),
        description: (formData.description || '').trim(),
        status: formData.status || 'pending',
        priority: formData.priority || 'medium',
        dueDate: formData.dueDate ? formData.dueDate : null
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      // Error message handled in parent / toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Task Title"
          id="task-title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Design GraphQL Schema or Implement Redis Cache"
          error={errors.title}
          required
          autoFocus
        />

        <div className="form-group">
          <label htmlFor="task-description" className="form-label">
            Description
          </label>
          <textarea
            id="task-description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Add relevant notes, acceptance criteria, or links..."
            className="form-control"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="modal-grid-2col">
          <Select
            label="Status"
            id="task-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' }
            ]}
          />

          <Select
            label="Priority"
            id="task-priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
          />
        </div>

        <Input
          label="Due Date"
          id="task-due-date"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleChange}
          helperText="Optional deadline for task completion"
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} id="btn-save-task">
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
