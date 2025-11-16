// lib/shared/error-handler.js

import { ERROR_MESSAGES } from '@/utils/constants';

/**
 * معالجة الأخطاء (shared)
 */
export function handleError(error, isDevelopment = false) {
    // Create detailed error object
    const errorDetails = {
        message: error?.message || 'Unknown error',
        detail: error?.detail, // Preserve detail from RFC 9110 format
        name: error?.name || 'Error',
        status: error?.status || 500,
        stack: error?.stack,
        data: error?.data,
    };

    if (isDevelopment) {
        console.error('API Error Details:', errorDetails);
    }

    // Timeout error
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        return {
            success: false,
            error: ERROR_MESSAGES.ar.TIMEOUT,
            detail: error?.detail, // Preserve detail
            errorCode: 'TIMEOUT',
            status: 408,
            details: isDevelopment ? errorDetails : undefined
        };
    }

    // Network error
    if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
        return {
            success: false,
            error: ERROR_MESSAGES.ar.NETWORK,
            detail: error?.detail, // Preserve detail
            errorCode: 'NETWORK',
            status: 0,
            details: isDevelopment ? errorDetails : undefined
        };
    }

    // API error with status - PRIORITIZE detail from backend
    if (error?.status) {
        return {
            success: false,
            error: error.detail || error.message || ERROR_MESSAGES.ar.SERVER_ERROR,
            detail: error.detail, // Explicitly include detail
            errorCode: 'API_ERROR',
            status: error.status,
            data: error.data,
            title: error.title,
            type: error.type,
            traceId: error.traceId,
            details: isDevelopment ? errorDetails : undefined
        };
    }

    // Unknown error
    return {
        success: false,
        error: error?.detail || error?.message || ERROR_MESSAGES.ar.SERVER_ERROR,
        detail: error?.detail, // Preserve detail
        errorCode: 'UNKNOWN',
        status: 500,
        details: isDevelopment ? errorDetails : undefined
    };
}

/**
 * Log error (مع مراعاة environment)
 */
export function logError(message, error, context = {}) {
    const isDev = process.env.NODE_ENV === 'development';

    const errorInfo = {
        message: error?.message || 'No error message',
        detail: error?.detail, // Log detail field
        name: error?.name || 'Unknown',
        stack: isDev ? error?.stack : undefined,
        ...context,
    };

    if (isDev) {
        console.error(`[ERROR] ${message}`, errorInfo);
    } else {
        // في production: send to error tracking service
        console.error(`[ERROR] ${message}`, {
            error: error?.message,
            detail: error?.detail,
            timestamp: new Date().toISOString(),
            ...context,
        });
    }
}