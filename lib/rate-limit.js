// lib/rate-limit.js
import { API_CONFIG, RATE_LIMITS, ERROR_MESSAGES } from '@/utils/constants';

class RateLimiter {
    constructor(options = {}) {
        this.requests = new Map();
        this.limit = options.limit || 10;
        this.window = options.window || 60000;
        this.cleanupInterval = null;
        this.maxMapSize = options.maxMapSize || 1000; // منع memory leak
    }

    check(identifier) {
        const now = Date.now();

        // حماية من memory overflow
        if (this.requests.size > this.maxMapSize) {
            this.forceCleanup();
        }

        const userRequests = this.requests.get(identifier) || [];
        const validRequests = userRequests.filter(
            (timestamp) => now - timestamp < this.window
        );

        if (validRequests.length >= this.limit) {
            const oldestRequest = validRequests[0];
            const retryAfter = Math.ceil((oldestRequest + this.window - now) / 1000);

            return {
                allowed: false,
                remaining: 0,
                retryAfter,
                resetAt: new Date(oldestRequest + this.window),
            };
        }

        validRequests.push(now);
        this.requests.set(identifier, validRequests);

        return {
            allowed: true,
            remaining: this.limit - validRequests.length,
            retryAfter: 0,
            resetAt: new Date(now + this.window),
        };
    }

    reset(identifier) {
        return this.requests.delete(identifier);
    }

    forceCleanup() {
        const now = Date.now();
        const toDelete = [];

        for (const [identifier, requests] of this.requests.entries()) {
            const validRequests = requests.filter(
                (timestamp) => now - timestamp < this.window
            );

            if (validRequests.length === 0) {
                toDelete.push(identifier);
            } else {
                this.requests.set(identifier, validRequests);
            }
        }

        toDelete.forEach((id) => this.requests.delete(id));

        if (process.env.NODE_ENV === 'development') {
            console.log(`Rate limiter cleanup: removed ${toDelete.length} entries`);
        }
    }

    startAutoCleanup(interval = 5 * 60 * 1000) {
        if (typeof setInterval === 'undefined') return;

        this.stopAutoCleanup();
        this.cleanupInterval = setInterval(() => this.forceCleanup(), interval);
    }

    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

export const authLimiter = new RateLimiter(RATE_LIMITS.AUTH);
export const apiLimiter = new RateLimiter(RATE_LIMITS.API);
export const searchLimiter = new RateLimiter(RATE_LIMITS.SEARCH);

// Auto cleanup
authLimiter.startAutoCleanup();
apiLimiter.startAutoCleanup();
searchLimiter.startAutoCleanup();

/**
 * استخراج identifier آمن
 */
export function getClientIdentifier(request) {
    const headers = request.headers;

    // محاولة الحصول على IP من headers مختلفة
    const forwardedFor = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare

    const ip =
        cfConnectingIp ||
        (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) ||
        'unknown';

    // Hash الـ IP لحماية الخصوصية في logs
    const hash = simpleHash(ip);

    return hash;
}

// Simple hash function
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}