import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../services/api';

describe('API Client Network Error Sanitization', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sanitizes Failed to fetch into user-friendly network connection error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiClient('/auth/login', { method: 'POST' })).rejects.toThrow(
      'Network connection error. Please check your internet connection and try again.'
    );
  });

  it('sanitizes raw MongoDB Atlas DNS getaddrinfo ENOTFOUND server response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: {
        get: () => 'application/json'
      },
      json: async () => ({
        success: false,
        message: 'getaddrinfo ENOTFOUND ac-wmb0igr-shard-00-00.474rksy.mongodb.net'
      })
    });

    await expect(apiClient('/auth/login', { method: 'POST' })).rejects.toThrow(
      'Network connection error. Please check your internet connection and try again.'
    );
  });

  it('sanitizes 503 Service Unavailable into friendly network connection error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: {
        get: () => 'application/json'
      },
      json: async () => ({
        success: false,
        message: 'Network connection error. Please check your internet connection and try again.'
      })
    });

    await expect(apiClient('/auth/login', { method: 'POST' })).rejects.toThrow(
      'Network connection error. Please check your internet connection and try again.'
    );
  });
});
