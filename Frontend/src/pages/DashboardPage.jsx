import React, { useState } from 'react';
import useTasks from '../hooks/useTasks';
import TaskStats from '../components/tasks/TaskStats';
import TaskFilterBar from '../components/tasks/TaskFilterBar';
import TaskCard from '../components/tasks/TaskCard';
import TaskFormModal from '../components/tasks/TaskFormModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import Pagination from '../components/tasks/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { TaskCardSkeleton } from '../components/common/Loader';
import Button from '../components/common/Button';
import { Plus, Inbox, RefreshCw, AlertCircle } from 'lucide-react';

export const DashboardPage = ({ isCreateModalOpen, onCloseCreateModal }) => {
  const {
    tasks,
    stats,
    loading,
    error,
    pagination,
    page,
    limit,
    statusFilter,
    priorityFilter,
    searchQuery,
    sortBy,
    sortOrder,
    setStatusFilter,
    setPriorityFilter,
    setSearchQuery,
    setSort,
    setPage,
    setLimit,
    reload,
    createTask,
    updateTask,
    deleteTask
  } = useTasks();

  // Modal states
  const [selectedTaskForView, setSelectedTaskForView] = useState(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers for Task CRUD
  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await createTask(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    if (!selectedTaskForEdit) return;
    setIsSubmitting(true);
    try {
      await updateTask(selectedTaskForEdit._id, formData);
      setSelectedTaskForEdit(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTaskForDelete) return;
    setIsSubmitting(true);
    try {
      await deleteTask(selectedTaskForDelete._id);
      setSelectedTaskForDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSort('createdAt', 'desc');
  };

  const handleCloseTaskModal = React.useCallback(() => {
    setSelectedTaskForEdit(null);
    if (onCloseCreateModal) onCloseCreateModal();
  }, [onCloseCreateModal]);

  return (
    <div style={{ padding: '2rem 0 3rem' }}>
      <div className="container">
        {/* Header Title Section */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>
              Task <span className="text-gradient">Workspace</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Track sprints, prioritize blockers, and monitor delivery progress
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={reload}
              title="Refresh task list"
              aria-label="Refresh task list"
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setSelectedTaskForEdit({})} // Open empty form
              id="btn-add-task-main"
              aria-label="Add new task"
            >
              Add Task
            </Button>
          </div>
        </div>

        {/* 1. Dashboard Statistics Cards */}
        <TaskStats
          stats={stats}
          activeFilter={statusFilter}
          onSelectFilter={(filterKey) => setStatusFilter(filterKey)}
        />

        {/* 2. Filter, Search, and Sort Bar */}
        <TaskFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={setSort}
          onResetFilters={handleResetFilters}
        />

        {/* Error Alert State */}
        {error && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              color: '#fca5a5'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={20} color="var(--danger)" />
              <span>{error}</span>
            </div>
            <Button variant="danger" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        )}

        {/* 3. Task Cards Grid / Skeletons / Empty State */}
        {loading ? (
          <div className="task-grid">
            {[...Array(6)].map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '1.25rem'
              }}
            >
              <Inbox size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No tasks found
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? "No tasks match your current search or filter criteria. Try resetting your filters."
                : "You don't have any tasks registered yet. Create your first task to kick off your workflow!"}
            </p>
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' ? (
              <Button variant="secondary" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setSelectedTaskForEdit({})}
              >
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          /* Task Grid */
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onView={(t) => setSelectedTaskForView(t)}
                onEdit={(t) => setSelectedTaskForEdit(t)}
                onDelete={(t) => setSelectedTaskForDelete(t)}
                onQuickStatusChange={handleQuickStatusChange}
              />
            ))}
          </div>
        )}

        {/* 4. Pagination */}
        {!loading && tasks.length > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => setLimit(newLimit)}
          />
        )}
      </div>

      {/* Modals */}
      {/* Create / Edit Modal */}
      <TaskFormModal
        isOpen={Boolean(selectedTaskForEdit || isCreateModalOpen)}
        onClose={handleCloseTaskModal}
        onSubmit={selectedTaskForEdit?._id ? handleEditSubmit : handleCreateSubmit}
        initialData={selectedTaskForEdit?._id ? selectedTaskForEdit : null}
        isLoading={isSubmitting}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskForView)}
        onClose={() => setSelectedTaskForView(null)}
        task={selectedTaskForView}
        onEdit={(t) => {
          setSelectedTaskForView(null);
          setSelectedTaskForEdit(t);
        }}
        onDelete={(t) => {
          setSelectedTaskForView(null);
          setSelectedTaskForDelete(t);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(selectedTaskForDelete)}
        onClose={() => setSelectedTaskForDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${selectedTaskForDelete?.title}"? This action cannot be reversed.`}
        confirmLabel="Delete Task"
        confirmVariant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default DashboardPage;
