// lib/server-fetch.js
import { auth } from '@/auth';
import { API_CONFIG } from '@/utils/constants';
import { getApiLangCode } from '@/utils/locale';
import {
  fetchWithTimeout,
  buildBaseHeaders
} from './shared/fetch-utils';
import {
  handleResponse
} from './shared/response-handler';
import {
  handleError,
  logError
} from './shared/error-handler';

/**
 * Server-side fetch with improved error handling
 */
export async function serverFetch(endpoint, options = {}) {
  const {
    locale = 'ar',
    method = 'GET',
    body = null,
    headers: customHeaders = {},
    revalidate,
    cache,
    tags = [],
    includeAuth = true,
    timeout = API_CONFIG.TIMEOUT,
  } = options;

  // Ensure endpoint doesn't have double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;

  const headers = buildBaseHeaders(locale, customHeaders);

  // Add auth token from NextAuth session
  if (includeAuth) {
    try {
      const session = await auth();
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      logError('Session fetch failed', error, { context: 'server-fetch' });
    }
  }

  const fetchOptions = {
    method,
    headers,
  };

  // Add body for non-GET requests
  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = JSON.stringify(body);
  }

  // Add Next.js caching strategy
  if (revalidate !== undefined) {
    fetchOptions.next = { revalidate, tags };
  } else if (cache) {
    fetchOptions.cache = cache;
  } else {
    // Default: revalidate every 60 seconds
    fetchOptions.next = { revalidate: 60, tags };
  }

  // Log request details in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Server Fetch] ${method} ${url}`);
    console.log('[Headers]', headers);
  }

  try {
    const response = await fetchWithTimeout(url, fetchOptions, timeout);
    return await handleResponse(response);
  } catch (error) {
    // Enhanced error logging
    logError(`Server fetch error [${method} ${cleanEndpoint}]`, error, {
      url,
      method,
      headers: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : undefined },
      locale,
    });

    return handleError(error, process.env.NODE_ENV === 'development');
  }
}

/**
 * Convenience methods with proper typing
 */
export const serverApi = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  get: (endpoint, options = {}) =>
    serverFetch(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: (endpoint, body, options = {}) =>
    serverFetch(endpoint, { ...options, method: 'POST', body }),

  /**
   * PUT request
   */
  put: (endpoint, body, options = {}) =>
    serverFetch(endpoint, { ...options, method: 'PUT', body }),

  /**
   * PATCH request
   */
  patch: (endpoint, body, options = {}) =>
    serverFetch(endpoint, { ...options, method: 'PATCH', body }),

  /**
   * DELETE request
   */
  delete: (endpoint, options = {}) =>
    serverFetch(endpoint, { ...options, method: 'DELETE' }),
};