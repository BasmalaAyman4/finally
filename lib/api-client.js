// lib/api-client.js
import { getSession } from 'next-auth/react';

import { API_CONFIG } from '@/utils/constants';
import { getApiLangCode } from '@/utils/locale';
import {
  fetchWithRetry,
  buildBaseHeaders
} from './shared/fetch-utils';
import {
  handleResponse
} from './shared/response-handler';
import {
  handleError,
  logError
} from './shared/error-handler';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.activeRequests = new Map();
    this.requestCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  /**
   * Get headers مع auth token
   */
  async getHeaders(locale, customHeaders = {}) {
    const langCode = getApiLangCode(locale);
    const headers = buildBaseHeaders(locale, customHeaders);

    // Add langCode
    headers['langCode'] = langCode;

    // Add auth token from NextAuth
    if (typeof window !== 'undefined') {
      try {
        const session = await getSession();
        if (session?.accessToken) {
          headers['Authorization'] = `Bearer ${session.accessToken}`;
        }
      } catch (error) {
        logError('Session fetch failed', error);
      }
    }

    return headers;
  }

  /**
   * Cache helpers
   */
  getCacheKey(method, endpoint, locale) {
    return `${method}-${endpoint}-${locale}`;
  }

  getFromCache(cacheKey) {
    const cached = this.requestCache.get(cacheKey);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp >= this.cacheTimeout) {
      this.requestCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  setCache(cacheKey, data) {
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Cleanup old entries
    if (this.requestCache.size > 100) {
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
    }
  }

  /**
   * Request deduplication
   */
  async deduplicateRequest(requestKey, requestFn) {
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey);
    }

    const promise = requestFn();
    this.activeRequests.set(requestKey, promise);

    try {
      return await promise;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * GET request
   */
  async get(endpoint, locale = 'ar', options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.getCacheKey('GET', endpoint, locale);

    // Check cache
    if (!options.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const headers = await this.getHeaders(locale, options.headers);

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const response = await fetchWithRetry(
          url,
          { method: 'GET', headers },
          options.retries,
          options.timeout
        );

        const result = await handleResponse(response);

        // Cache successful response
        if (result.success && !options.skipCache) {
          this.setCache(cacheKey, result);
        }

        return result;
      } catch (error) {
        return handleError(error, process.env.NODE_ENV === 'development');
      }
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data, locale = 'ar', options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(locale, options.headers);

    try {
      const response = await fetchWithRetry(
        url,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        },
        options.retries,
        options.timeout
      );

      return await handleResponse(response);
    } catch (error) {
      return handleError(error, process.env.NODE_ENV === 'development');
    }
  }

  /**
   * PUT request
   */
  async put(endpoint, data, locale = 'ar', options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(locale, options.headers);

    try {
      const response = await fetchWithRetry(
        url,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        },
        options.retries,
        options.timeout
      );

      return await handleResponse(response);
    } catch (error) {
      return handleError(error, process.env.NODE_ENV === 'development');
    }
  }

  /**
   * DELETE request
   */
  async delete(endpoint, locale = 'ar', options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(locale, options.headers);

    try {
      const response = await fetchWithRetry(
        url,
        { method: 'DELETE', headers },
        options.retries,
        options.timeout
      );

      return await handleResponse(response);
    } catch (error) {
      return handleError(error, process.env.NODE_ENV === 'development');
    }
  }

  cancelRequest(requestKey) {
    return this.activeRequests.delete(requestKey);
  }

  cancelAll() {
    this.activeRequests.clear();
  }
}

const apiClient = new ApiClient();
export default apiClient;

export const api = {
  get: (endpoint, locale, options) => apiClient.get(endpoint, locale, options),
  post: (endpoint, data, locale, options) => apiClient.post(endpoint, data, locale, options),
  put: (endpoint, data, locale, options) => apiClient.put(endpoint, data, locale, options),
  delete: (endpoint, locale, options) => apiClient.delete(endpoint, locale, options),
  cancelRequest: (key) => apiClient.cancelRequest(key),
  cancelAll: () => apiClient.cancelAll(),
};