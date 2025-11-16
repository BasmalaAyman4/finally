// lib/shared/fetch-utils.js

import { getApiLangCode } from '@/utils/locale';
import { API_CONFIG, ERROR_MESSAGES } from '@/utils/constants';

/**
 * Fetch مع timeout (shared بين client و server)
 */
export async function fetchWithTimeout(url, options, timeout = API_CONFIG.TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort/timeout
        if (error.name === 'AbortError') {
            const timeoutError = new Error(
                `Request timeout after ${timeout}ms: ${url}`
            );
            timeoutError.name = 'TimeoutError';
            timeoutError.status = 408;
            timeoutError.url = url;
            throw timeoutError;
        }

        // Network error
        if (error.message === 'Failed to fetch') {
            const networkError = new Error(
                `Network error: Unable to reach ${url}`
            );
            networkError.name = 'NetworkError';
            networkError.status = 0;
            networkError.url = url;
            throw networkError;
        }

        // Re-throw original error with additional context
        error.url = url;
        throw error;
    }
}

/**
 * Retry logic (shared)
 */
export async function fetchWithRetry(
    url,
    options,
    retries = API_CONFIG.RETRY_ATTEMPTS,
    timeout = API_CONFIG.TIMEOUT
) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options, timeout);

            // لو 5xx error، جرب تاني
            if (response.status >= 500 && attempt < retries) {
                const waitTime = API_CONFIG.RETRY_DELAY * (attempt + 1);
                console.warn(
                    `Server error ${response.status}, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries})`
                );
                await delay(waitTime);
                continue;
            }

            return response;
        } catch (error) {
            lastError = error;

            const isRetryable =
                error.name === 'TimeoutError' ||
                error.name === 'NetworkError' ||
                error.message === 'Failed to fetch' ||
                error.name === 'TypeError';

            // لو network error أو timeout، جرب تاني
            if (isRetryable && attempt < retries) {
                const waitTime = API_CONFIG.RETRY_DELAY * (attempt + 1);
                console.warn(
                    `${error.name || 'Network error'}, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries})`
                );
                await delay(waitTime);
                continue;
            }

            // No more retries
            throw error;
        }
    }

    throw lastError;
}

/**
 * Delay helper
 */
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build headers (shared logic)
 */
export function buildBaseHeaders(locale, customHeaders = {}) {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'langCode': getApiLangCode(locale),
        'X-Client-Type': 'Web',
        'webOrMob':'2',
        ...customHeaders,
    };
}