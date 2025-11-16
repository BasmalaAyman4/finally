// lib/shared/response-handler.js

import { ERROR_MESSAGES } from '@/utils/constants';

/**
 * معالجة Response (shared بين client و server)
 */
export async function handleResponse(response) {
    const contentType = response.headers.get('content-type');

    let data;
    if (contentType?.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        // Try to parse as JSON if it's a JSON string
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        // If data is still a string, try to parse it one more time
        let errorData = data;
        if (typeof data === 'string') {
            try {
                errorData = JSON.parse(data);
            } catch {
                errorData = { message: data };
            }
        }

        // Extract error message from RFC 9110 format
        // Priority: detail > message > title > generic error
        const errorMessage = errorData.detail || errorData.message || errorData.title || ERROR_MESSAGES.ar.SERVER_ERROR;

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        error.detail = errorData.detail; // Preserve the detail field
        error.title = errorData.title;
        error.type = errorData.type;
        error.traceId = errorData.traceId;

        throw error;
    }

    return {
        success: true,
        data,
        status: response.status,
    };
}

/**
 * Parse error response
 */
export function parseErrorResponse(data) {
    if (typeof data === 'string') {
        return data;
    }

    // Extract error message with priority: detail > message > error > title
    return data?.detail || data?.message || data?.error || data?.title || ERROR_MESSAGES.ar.SERVER_ERROR;
}