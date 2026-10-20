const { errorHandler } = require('../src/middlewares/errorMiddleware');
const ApiError = require('../src/utils/apiError');

describe('Error Handling Middleware - Network & System Errors', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      originalUrl: '/api/auth/login'
    };
    mockRes = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    mockNext = jest.fn();
  });

  it('should transform DNS ENOTFOUND error into friendly network connection error with 503 status', () => {
    const dnsError = new Error('getaddrinfo ENOTFOUND ac-wmb0igr-shard-00-00.474rksy.mongodb.net');
    dnsError.code = 'ENOTFOUND';

    errorHandler(dnsError, mockReq, mockRes, mockNext);

    expect(mockRes.statusCode).toBe(503);
    expect(mockRes.jsonData.success).toBe(false);
    expect(mockRes.jsonData.message).toBe(
      'Network connection error. Please check your internet connection and try again.'
    );
    // Ensure internal shard hostname is never exposed in response
    expect(JSON.stringify(mockRes.jsonData)).not.toContain('ac-wmb0igr-shard');
  });

  it('should transform MongooseServerSelectionError into friendly network error', () => {
    const mongoError = new Error('Server selection timed out after 30000 ms');
    mongoError.name = 'MongooseServerSelectionError';

    errorHandler(mongoError, mockReq, mockRes, mockNext);

    expect(mockRes.statusCode).toBe(503);
    expect(mockRes.jsonData.message).toBe(
      'Network connection error. Please check your internet connection and try again.'
    );
  });

  it('should transform ECONNREFUSED error into friendly network error', () => {
    const connError = new Error('connect ECONNREFUSED 127.0.0.1:27017');
    connError.code = 'ECONNREFUSED';

    errorHandler(connError, mockReq, mockRes, mockNext);

    expect(mockRes.statusCode).toBe(503);
    expect(mockRes.jsonData.message).toBe(
      'Network connection error. Please check your internet connection and try again.'
    );
  });

  it('should preserve standard ApiError client validation messages', () => {
    const clientError = ApiError.badRequest('Invalid email or password.');

    errorHandler(clientError, mockReq, mockRes, mockNext);

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes.jsonData.message).toBe('Invalid email or password.');
  });
});
