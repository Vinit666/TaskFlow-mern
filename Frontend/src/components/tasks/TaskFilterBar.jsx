import React from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';

export const TaskFilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  sortOrder,
  onSortChange,
  onResetFilters
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Left: Search input */}
      <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 300px' }}>
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}
        >
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by title..."
          className="form-control"
          style={{ paddingLeft: '38px', height: '42px' }}
          id="task-search-input"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="btn btn-ghost btn-icon btn-sm"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '4px'
            }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right Controls: Filters & Sort */}
      <div className="filter-bar-controls">
        {/* Status Filter */}
        <div className="filter-group">
          <label htmlFor="filter-status" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Status:
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="form-control"
            style={{ height: '42px', minWidth: '130px', cursor: 'pointer' }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="filter-group">
          <label htmlFor="filter-priority" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Priority:
          </label>
          <select
            id="filter-priority"
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="form-control"
            style={{ height: '42px', minWidth: '130px', cursor: 'pointer' }}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="filter-group">
          <label htmlFor="filter-sort" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Sort:
          </label>
          <select
            id="filter-sort"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onSortChange(field, order);
            }}
            className="form-control"
            style={{ height: '42px', minWidth: '150px', cursor: 'pointer' }}
          >
            <option value="createdAt-desc">Newest Created</option>
            <option value="createdAt-asc">Oldest Created</option>
            <option value="dueDate-asc">Due Soonest</option>
            <option value="dueDate-desc">Due Furthest</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="btn btn-secondary btn-sm"
            style={{ height: '42px', gap: '0.35rem' }}
            title="Reset all filters to default"
          >
            <X size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskFilterBar;
