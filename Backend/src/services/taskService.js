const Task = require('../models/Task');
const ApiError = require('../utils/apiError');

class TaskService {
  /**
   * Creates a new task strictly associated with the authenticated user
   * @param {string} userId - Authenticated user's ObjectId
   * @param {Object} taskData - { title, description, status, priority, dueDate }
   * @returns {Promise<Object>} Created Task
   */
  static async createTask(userId, taskData) {
    const { title, description, status, priority, dueDate } = taskData;

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      userId
    });

    return task;
  }

  /**
   * Retrieves tasks for the authenticated user with filtering, searching, sorting, and pagination
   * @param {string} userId
   * @param {Object} queryParams
   * @returns {Promise<Object>} { tasks, pagination, stats }
   */
  static async getTasks(userId, queryParams = {}) {
    const {
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = queryParams;

    // Strict user scoping
    const query = { userId };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search by title (case-insensitive regex)
    if (search && search.trim() !== '') {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Sorting options: creation date or due date
    const allowedSortFields = ['createdAt', 'dueDate', 'title', 'priority', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [tasks, totalCount] = await Promise.all([
      Task.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Task.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return {
      tasks,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  }

  /**
   * Retrieves task statistics (counts for total, pending, in-progress, completed) for user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getTaskStats(userId) {
    const counts = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      pending: 0,
      'in-progress': 0,
      completed: 0
    };

    counts.forEach((item) => {
      if (stats.hasOwnProperty(item._id)) {
        stats[item._id] = item.count;
      }
      stats.total += item.count;
    });

    return stats;
  }

  /**
   * Retrieves a single task ensuring user ownership
   * @param {string} userId
   * @param {string} taskId
   * @returns {Promise<Object>}
   */
  static async getTaskById(userId, taskId) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw ApiError.notFound(`Task with ID "${taskId}" not found.`);
    }

    // Enforce strict ownership check
    if (task.userId.toString() !== userId.toString()) {
      throw ApiError.forbidden('Access forbidden: You do not have permission to view this task.');
    }

    return task;
  }

  /**
   * Updates an existing task ensuring user ownership
   * @param {string} userId
   * @param {string} taskId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  static async updateTask(userId, taskId, updateData) {
    // First verify task exists and belongs to user
    const existingTask = await Task.findById(taskId);

    if (!existingTask) {
      throw ApiError.notFound(`Task with ID "${taskId}" not found.`);
    }

    if (existingTask.userId.toString() !== userId.toString()) {
      throw ApiError.forbidden('Access forbidden: You do not have permission to modify this task.');
    }

    const { title, description, status, priority, dueDate } = updateData;

    if (title !== undefined) existingTask.title = title.trim();
    if (description !== undefined) existingTask.description = description ? description.trim() : '';
    if (status !== undefined) existingTask.status = status;
    if (priority !== undefined) existingTask.priority = priority;
    if (dueDate !== undefined) existingTask.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await existingTask.save();
    return updatedTask;
  }

  /**
   * Deletes a task ensuring user ownership
   * @param {string} userId
   * @param {string} taskId
   * @returns {Promise<Object>} Deleted task
   */
  static async deleteTask(userId, taskId) {
    const existingTask = await Task.findById(taskId);

    if (!existingTask) {
      throw ApiError.notFound(`Task with ID "${taskId}" not found.`);
    }

    if (existingTask.userId.toString() !== userId.toString()) {
      throw ApiError.forbidden('Access forbidden: You do not have permission to delete this task.');
    }

    await existingTask.deleteOne();
    return existingTask;
  }
}

module.exports = TaskService;
