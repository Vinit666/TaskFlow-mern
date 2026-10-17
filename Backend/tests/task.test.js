const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

let mongoServer;
let user1Token;
let user1Id;
let user2Token;
let user2Id;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_tasks_999';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});

  // Setup User 1
  const u1Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User One', email: 'user1@example.com', password: 'Password123!' });
  user1Token = u1Res.body.data.token;
  user1Id = u1Res.body.data.user.id;

  // Setup User 2 (for authorization tests)
  const u2Res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User Two', email: 'user2@example.com', password: 'Password123!' });
  user2Token = u2Res.body.data.token;
  user2Id = u2Res.body.data.user.id;
});

describe('Task Management API Endpoints & Authorization Checks', () => {
  describe('POST /api/tasks (Create Task)', () => {
    it('should create a task successfully for the authenticated user', async () => {
      const taskData = {
        title: 'Complete System Architecture Review',
        description: 'Build full-stack MERN application with tests',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2026-12-31'
      };

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(taskData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe(taskData.title);
      expect(res.body.data.task.status).toBe('in-progress');
      expect(res.body.data.task.priority).toBe('high');
      expect(res.body.data.task.userId).toBe(user1Id);
    });

    it('should reject task creation with missing title (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ description: 'No title provided' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject task creation with invalid status or priority', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Invalid values',
          status: 'unknown-status',
          priority: 'extreme'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Unauthenticated Task' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/tasks (List User Tasks, Filter, Sort, Pagination)', () => {
    beforeEach(async () => {
      // Seed 3 tasks for User 1
      await Task.create([
        { title: 'Frontend UI Design', status: 'pending', priority: 'low', userId: user1Id },
        { title: 'Backend REST API', status: 'completed', priority: 'high', userId: user1Id },
        { title: 'Database Optimization', status: 'in-progress', priority: 'medium', userId: user1Id }
      ]);

      // Seed 1 task for User 2 (must not be visible to User 1)
      await Task.create({
        title: 'User 2 Secret Task',
        status: 'pending',
        priority: 'high',
        userId: user2Id
      });
    });

    it('should list only tasks belonging to authenticated user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(3);
      expect(res.body.data.pagination.total).toBe(3);
      // Ensure User 2 task is never present
      const hasOtherUserTask = res.body.data.tasks.some((t) => t.title === 'User 2 Secret Task');
      expect(hasOtherUserTask).toBe(false);
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=completed')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Backend REST API');
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Backend REST API');
    });

    it('should search tasks by title keyword', async () => {
      const res = await request(app)
        .get('/api/tasks?search=Database')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Database Optimization');
    });

    it('should paginate tasks properly', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasNextPage).toBe(true);
    });
  });

  describe('Cross-User Authorization & Security Checks', () => {
    let user1TaskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: "User One's Private Task",
        description: 'Sensitive work',
        status: 'pending',
        priority: 'high',
        userId: user1Id
      });
      user1TaskId = task._id.toString();
    });

    it('User 1 can retrieve their own task by ID', async () => {
      const res = await request(app)
        .get(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.title).toBe("User One's Private Task");
    });

    it('SECURITY CHECK: User 2 CANNOT access User 1 task (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('SECURITY CHECK: User 2 CANNOT update User 1 task (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ title: 'Hacked by User 2' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify task in DB remained unchanged
      const taskInDb = await Task.findById(user1TaskId);
      expect(taskInDb.title).toBe("User One's Private Task");
    });

    it('SECURITY CHECK: User 2 CANNOT delete User 1 task (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify task in DB was not deleted
      const taskInDb = await Task.findById(user1TaskId);
      expect(taskInDb).not.toBeNull();
    });

    it('User 1 CAN update their own task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'completed', priority: 'low' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.status).toBe('completed');
      expect(res.body.data.task.priority).toBe('low');
    });

    it('User 1 CAN delete their own task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${user1TaskId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);

      const checkInDb = await Task.findById(user1TaskId);
      expect(checkInDb).toBeNull();
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('should return accurate task counts grouped by status', async () => {
      await Task.create([
        { title: 'T1', status: 'pending', userId: user1Id },
        { title: 'T2', status: 'pending', userId: user1Id },
        { title: 'T3', status: 'in-progress', userId: user1Id },
        { title: 'T4', status: 'completed', userId: user1Id }
      ]);

      const res = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.stats.total).toBe(4);
      expect(res.body.data.stats.pending).toBe(2);
      expect(res.body.data.stats['in-progress']).toBe(1);
      expect(res.body.data.stats.completed).toBe(1);
    });
  });
});
