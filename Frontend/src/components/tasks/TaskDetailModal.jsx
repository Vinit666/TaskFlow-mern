import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';

export const TaskDetailModal = ({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete
}) => {
  if (!task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'None';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Overview" maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Status and Priority Row */}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <Badge type="status" value={task.status} />
          <Badge type="priority" value={task.priority} />
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {task.title}
        </h3>

        {/* Description */}
        <div
          style={{
            backgroundColor: '#0b1120',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Description
          </span>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              marginTop: '0.5rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {task.description || <em>No additional details provided for this task.</em>}
          </p>
        </div>

        {/* Timestamps & Due Date Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Calendar size={13} />
              <span>Due Date</span>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '4px' }}>
              {formatDate(task.dueDate)}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Clock size={13} />
              <span>Created</span>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '4px' }}>
              {formatTimestamp(task.createdAt)}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Clock size={13} />
              <span>Last Updated</span>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '4px' }}>
              {formatTimestamp(task.updatedAt)}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => {
              onClose();
              onDelete(task);
            }}
          >
            Delete Task
          </Button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Edit2}
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              Edit Task
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
