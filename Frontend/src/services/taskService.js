import apiClient from './api';

export const taskService = {
  /**
   * Fetches user's tasks with search, filter, sort, and pagination query params
   */
  getTasks: async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const queryString = query.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient(endpoint, { method: 'GET' });
    return res.data;
  },

  /**
   * Fetches aggregated status metrics for user dashboard
   */
  getStats: async () => {
    const res = await apiClient('/tasks/stats', { method: 'GET' });
    return res.data?.stats;
  },

  /**
   * Creates a new task
   */
  createTask: async (taskData) => {
    const res = await apiClient('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return res.data?.task;
  },

  /**
   * Retrieves single task by ID
   */
  getTaskById: async (id) => {
    const res = await apiClient(`/tasks/${id}`, { method: 'GET' });
    return res.data?.task;
  },

  /**
   * Updates existing task by ID
   */
  updateTask: async (id, taskData) => {
    const res = await apiClient(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
    return res.data?.task;
  },

  /**
   * Deletes task by ID
   */
  deleteTask: async (id) => {
    const res = await apiClient(`/tasks/${id}`, {
      method: 'DELETE'
    });
    return res.data?.task;
  }
};

export default taskService;
