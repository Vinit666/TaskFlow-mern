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

  describe('PUT /api/auth/profile (Protected Route)', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Original Name',
          email: 'profiletest@example.com',
          password: 'Password123!'
        });
      token = reg.body.data.token;
      userId = reg.body.data.user.id;
    });

    it('should update user name successfully', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Updated Name');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Name');
    });

    it('should upload avatar photo under 5MB and update user avatar path', async () => {
      const fakeImageBuffer = Buffer.from('fake image content');
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Name With Avatar')
        .attach('avatar', fakeImageBuffer, 'test-photo.png');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.avatar).toMatch(/^\/uploads\/avatars\/avatar-/);
      expect(res.body.data.user.name).toBe('Name With Avatar');
    });

    it('should reject avatar larger than 5MB', async () => {
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5MB
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .attach('avatar', largeBuffer, 'huge.png');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/5 MB/i);
    });
  });

  describe('Forgot Password with OTP Flow', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Reset Test User',
          email: 'forgotuser@example.com',
          password: 'OldPassword123!'
        });
    });

    it('should issue an OTP and send it for registered email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgotuser@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ email: 'forgotuser@example.com' }).select('+resetPasswordOtp +resetPasswordExpires');
      expect(user.resetPasswordOtp).toBeDefined();
      expect(user.resetPasswordOtp.length).toBe(6);
      expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should verify correct OTP successfully and reject wrong OTP', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgotuser@example.com' });

      const user = await User.findOne({ email: 'forgotuser@example.com' }).select('+resetPasswordOtp');
      const otp = user.resetPasswordOtp;

      // Bad OTP
      const badRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'forgotuser@example.com', otp: '000000' });
      expect(badRes.statusCode).toBe(400);

      // Good OTP
      const goodRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'forgotuser@example.com', otp });
      expect(goodRes.statusCode).toBe(200);
      expect(goodRes.body.success).toBe(true);
    });

    it('should reset password with valid OTP and allow login with new password', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgotuser@example.com' });

      const user = await User.findOne({ email: 'forgotuser@example.com' }).select('+resetPasswordOtp');
      const otp = user.resetPasswordOtp;

      // Reset password
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'forgotuser@example.com',
          otp,
          newPassword: 'BrandNewPassword123!'
        });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify old password fails
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'forgotuser@example.com',
          password: 'OldPassword123!'
        });
      expect(oldLogin.statusCode).toBe(401);

      // Verify new password succeeds
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'forgotuser@example.com',
          password: 'BrandNewPassword123!'
        });
      expect(newLogin.statusCode).toBe(200);
      expect(newLogin.body.data.token).toBeDefined();
    });
  });

  describe('Session and Login Time Tracking', () => {
    it('should increment loginCount and record session on repeated logins', async () => {
      // 1. Register
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Session User',
          email: 'sessionuser@example.com',
          password: 'Password123!'
        });

      expect(regRes.statusCode).toBe(201);
      expect(regRes.body.data.user.loginCount).toBe(1);
      expect(regRes.body.data.sessionId).toBeDefined();

      // 2. Login again
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sessionuser@example.com',
          password: 'Password123!'
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.data.user.loginCount).toBe(2);
      expect(loginRes.body.data.user.sessions.length).toBeGreaterThanOrEqual(2);
      expect(loginRes.body.data.user.lastLoginAt).toBeDefined();

      // 3. Sync session heartbeat
      const token = loginRes.body.data.token;
      const sessionId = loginRes.body.data.sessionId;

      const heartbeatRes = await request(app)
        .post('/api/auth/session-heartbeat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sessionId,
          durationSeconds: 120,
          isClosing: false
        });

      expect(heartbeatRes.statusCode).toBe(200);
      expect(heartbeatRes.body.data.totalSessionTime).toBeGreaterThanOrEqual(120);

      // 4. Logout should finalize the active session duration
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ sessionId });

      expect(logoutRes.statusCode).toBe(200);

      // Verify user sessions in DB
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.statusCode).toBe(200);
      const userDoc = meRes.body.data.user;
      const closedSession = userDoc.sessions.find((s) => s.sessionId === sessionId);
      expect(closedSession.isActive).toBe(false);
      expect(closedSession.logoutAt).toBeDefined();
      expect(closedSession.durationSeconds).toBeGreaterThanOrEqual(120);
    });

    it('should support session-leave candidate and resume without disrupting session', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Tab Close User',
          email: 'tabcloseuser@example.com',
          password: 'Password123!'
        });

      const token = reg.body.data.token;
      const sessionId = reg.body.data.sessionId;

      // 1. Send session-leave (like when user triggers beforeunload / F5)
      const leaveRes = await request(app)
        .post('/api/auth/session-leave')
        .send({
          sessionId,
          durationSeconds: 45,
          leaveTime: Date.now()
        });

      expect(leaveRes.statusCode).toBe(200);

      // 2. Immediately send session-resume (simulating quick page refresh)
      const resumeRes = await request(app)
        .post('/api/auth/session-resume')
        .send({ sessionId });

      expect(resumeRes.statusCode).toBe(200);

      // 3. User checks profile; session must still be active because reload resumed it
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.statusCode).toBe(200);
      const active = meRes.body.data.user.sessions.find((s) => s.sessionId === sessionId);
      expect(active.isActive).toBe(true);
      expect(active.logoutAt).toBeNull();
    });
  });
});
