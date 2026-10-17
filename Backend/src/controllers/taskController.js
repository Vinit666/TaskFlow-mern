const TaskService = require('../services/taskService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller retrieving user tasks with filters, search, sort, and pagination
 * GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const data = await TaskService.getTasks(req.user._id, req.query);
    return ApiResponse.success(res, data, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving task dashboard statistics
 * GET /api/tasks/stats
 */
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await TaskService.getTaskStats(req.user._id);
    return ApiResponse.success(res, { stats }, 'Task statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller creating a new task
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const task = await TaskService.createTask(req.user._id, req.body);
    return ApiResponse.created(res, { task }, 'Task created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving a specific task by ID
 * GET /api/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await TaskService.getTaskById(req.user._id, req.params.id);
    return ApiResponse.success(res, { task }, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller updating a specific task
 * PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await TaskService.updateTask(req.user._id, req.params.id, req.body);
    return ApiResponse.success(res, { task }, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller deleting a specific task
 * DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await TaskService.deleteTask(req.user._id, req.params.id);
    return ApiResponse.success(res, { task }, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskStats,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
};
