import React, { useState, useRef, useEffect } from 'react';
import Badge from '../common/Badge';
import { Calendar, Eye, Edit2, Trash2, CheckCircle2, Clock, Loader2, MoreVertical } from 'lucide-react';

export const TaskCard = ({
  task,
  onView,
  onEdit,
  onDelete,
  onQuickStatusChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue =
    task.dueDate &&
    task.status !== 'completed' &&
    new Date(task.dueDate).getTime() < Date.now();

  return (
    <div
      className="card task-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
      }}
      data-testid={`task-card-${task._id}`}
    >
      <div>
        {/* Top Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginBottom: '0.875rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Badge type="status" value={task.status} />
            <Badge type="priority" value={task.priority} />
          </div>

          {/* Quick status cycle button */}
          {onQuickStatusChange && (
            <button
              onClick={() => {
                const nextStatus =
                  task.status === 'pending'
                    ? 'in-progress'
                    : task.status === 'in-progress'
                    ? 'completed'
                    : 'pending';
                onQuickStatusChange(task._id, nextStatus);
              }}
              title={`Advance status (current: ${task.status})`}
              aria-label={`Advance status (current: ${task.status})`}
              className="btn btn-ghost btn-icon btn-sm"
              style={{ padding: '4px' }}
            >
              {task.status === 'pending' && <Clock size={15} color="var(--warning)" />}
              {task.status === 'in-progress' && <Loader2 size={15} color="var(--info)" />}
              {task.status === 'completed' && <CheckCircle2 size={15} color="var(--success)" />}
            </button>
          )}
        </div>

        {/* Title (Sequential H2 under H1) */}
        <h2
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: task.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
            marginBottom: '0.5rem',
            wordBreak: 'break-word'
          }}
        >
          {task.title}
        </h2>

        {/* Description snippet */}
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.6rem'
          }}
        >
          {task.description || <em style={{ color: 'var(--text-secondary)' }}>No description provided</em>}
        </p>
      </div>

      {/* Card Footer: Due Date & Action Icons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.875rem',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem',
            color: isOverdue ? '#fca5a5' : 'var(--text-secondary)',
            fontWeight: isOverdue ? 600 : 500
          }}
        >
          <Calendar size={14} />
          <span>{formatDate(task.dueDate)}</span>
          {isOverdue && <span style={{ color: '#fca5a5', fontSize: '0.7rem' }}>(Overdue)</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {/* Eye View Button - Outside */}
          {onView && (
            <button
              onClick={() => onView(task)}
              className="btn btn-ghost btn-icon btn-sm"
              title="View full task details"
              aria-label="View task details"
            >
              <Eye size={15} />
            </button>
          )}

          {/* Vertical 3-dot Menu for Edit and Delete */}
          {(onEdit || onDelete) && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="btn btn-ghost btn-icon btn-sm"
                title="More task options"
                aria-label="More task options"
              >
                <MoreVertical size={15} />
              </button>

              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 'calc(100% + 4px)',
                  minWidth: '120px',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                  padding: '4px',
                  display: isMenuOpen ? 'flex' : 'none',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 20
                }}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(task);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)'
                    }}
                    title="Edit task"
                    aria-label="Edit task"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(task);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)'
                    }}
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
