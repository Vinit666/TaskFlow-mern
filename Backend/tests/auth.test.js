const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_12345';
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
});

describe('Authentication API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.name).toBe('Jane Doe');
      expect(res.body.data.user.password).toBeUndefined(); // Password must never leak

      // Verify user was saved in DB with hashed password
      const savedUser = await User.findOne({ email: 'jane@example.com' }).select('+password');
      expect(savedUser).not.toBeNull();
      expect(savedUser.password).not.toBe('Password123!'); // Must be hashed
    });

    it('should reject registration if email is already registered (409 Conflict)', async () => {
      await User.create({
        name: 'Existing User',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration if required fields are missing or invalid (400 Bad Request)', async () => {
      // Invalid email
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Valid Name',
          email: 'not-an-email',
          password: 'Password123!'
        });
      expect(res1.statusCode).toBe(400);

      // Short password
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Valid Name',
          email: 'valid@example.com',
          password: '123'
        });
      expect(res2.statusCode).toBe(400);

      // Missing name
      const res3 = await request(app)
        .post('/api/auth/register')
        .send({
          name: ' ',
          email: 'valid2@example.com',
          password: 'Password123!'
        });
      expect(res3.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'Password123!'
      });
    });

    it('should log in successfully with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login for non-existent email (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    it('should return authenticated user profile when valid token is provided', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Protected User',
          email: 'protected@example.com',
          password: 'Password123!'
        });

      const token = registerRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe('protected@example.com');
    });

    it('should reject request without Bearer token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
