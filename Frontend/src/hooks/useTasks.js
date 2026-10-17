import { useState, useEffect, useCallback } from 'react';
import taskService from '../services/taskService';
import { useToast } from '../context/ToastContext';
import useDebounce from './useDebounce';

/**
 * Custom hook to manage complete task state lifecycle:
 * Fetching, statistics, filtering, debounced searching, sorting, pagination, and mutations.
 */
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    'in-progress': 0,
    completed: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Sorting state (createdAt or dueDate)
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const { showToast } = useToast();

  // Reset page to 1 whenever filters change
  const handleSetStatus = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleSetPriority = (val) => {
    setPriorityFilter(val);
    setPage(1);
  };

  const handleSetSearch = (val) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    if (order) setSortOrder(order);
    setPage(1);
  };

  // Fetch tasks according to current state
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasks({
        status: statusFilter,
        priority: priorityFilter,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        page,
        limit
      });

      setTasks(data.tasks || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, debouncedSearch, sortBy, sortOrder, page, limit, showToast]);

  // Fetch overall task dashboard stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await taskService.getStats();
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Trigger load when dependencies change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Task Mutations
  const createTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      showToast('Task created successfully!', 'success');
      // Reload both tasks and statistics
      await Promise.all([loadTasks(), loadStats()]);
      return newTask;
    } catch (err) {
      showToast(err.message || 'Failed to create task', 'error');
      throw err;
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const updated = await taskService.updateTask(id, taskData);
      showToast('Task updated successfully!', 'success');
      await Promise.all([loadTasks(), loadStats()]);
      return updated;
    } catch (err) {
      showToast(err.message || 'Failed to update task', 'error');
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id);
      showToast('Task deleted successfully.', 'info');
      await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
      throw err;
    }
  };

  return {
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
    setStatusFilter: handleSetStatus,
    setPriorityFilter: handleSetPriority,
    setSearchQuery: handleSetSearch,
    setSort: handleSortChange,
    setPage,
    setLimit,
    reload: loadTasks,
    createTask,
    updateTask,
    deleteTask
  };
}

export default useTasks;
