const express = require('express');
const authRoutes = require('./authRoutes');
const taskRoutes = require('./taskRoutes');

const router = express.Router();

// API Root Index
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TaskFlow REST API is running',
    version: '1.0.0',
    documentation: '/README.md',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (Protected)',
        logout: 'POST /api/auth/logout (Protected)'
      },
      tasks: {
        list: 'GET /api/tasks (Protected, supports ?search=&status=&priority=&sort=&page=&limit=)',
        stats: 'GET /api/tasks/stats (Protected)',
        create: 'POST /api/tasks (Protected)',
        getById: 'GET /api/tasks/:id (Protected)',
        update: 'PUT /api/tasks/:id (Protected)',
        delete: 'DELETE /api/tasks/:id (Protected)'
      }
    }
  });
});

// System health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TaskFlow REST API'
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;
