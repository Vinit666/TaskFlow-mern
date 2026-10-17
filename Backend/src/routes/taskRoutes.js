const express = require('express');
const {
  getTasks,
  getTaskStats,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const authenticate = require('../middlewares/authMiddleware');
const { validateBody, validateTaskIdParam } = require('../middlewares/validateMiddleware');
const { validateTaskInput } = require('../utils/validators');

const router = express.Router();

// Enforce authentication on all task endpoints
router.use(authenticate);

// Task collection endpoints
router.get('/', getTasks);
router.get('/stats', getTaskStats);
router.post('/', validateBody(validateTaskInput, false), createTask);

// Single task endpoints
router.get('/:id', validateTaskIdParam, getTaskById);
router.put('/:id', validateTaskIdParam, validateBody(validateTaskInput, true), updateTask);
router.delete('/:id', validateTaskIdParam, deleteTask);

module.exports = router;
