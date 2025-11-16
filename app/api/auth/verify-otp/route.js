// app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { authLimiter, getClientIdentifier } from '@/lib/rate-limit';
import { validateOTP } from '@/utils/validations';
import { getErrorMessage, TIME_CONSTANTS } from '@/utils/constants';
import { getLocaleFromLangCode } from '@/utils/locale';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function POST(request) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
        'http://localhost:3000',
        'https://api.lajolie-eg.com'
    ];

    if (!allowedOrigins.includes(origin)) {
        return NextResponse.json(
            { error: 'Invalid origin' },
            { status: 403 }
        );
    }

    try {
        // 1. Rate limiting
        const identifier = getClientIdentifier(request);
        const rateLimit = authLimiter.check(identifier);

        if (!rateLimit.allowed) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`Rate limit exceeded for: ${identifier}`);
            }

            const locale = getLocaleFromLangCode(request.headers.get('langCode') || '1');
            const errorMsg = getErrorMessage('RATE_LIMIT', locale);

            return NextResponse.json(
                { error: `${errorMsg}. Try again after ${rateLimit.retryAfter} seconds` },
                {
                    status: 429,
                    headers: {
                        'Retry-After': rateLimit.retryAfter.toString(),
                    },
                }
            );
        }

        // 2. قراءة البيانات
        const body = await request.json().catch(() => ({}));
        const { userId, otp, langCode = '1' } = body;

        const locale = getLocaleFromLangCode(langCode);

        // Validate
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const otpValidation = validateOTP(otp);
        if (!otpValidation.valid) {
            return NextResponse.json(
                { error: otpValidation.error },
                { status: 400 }
            );
        }

        const cleanOTP = otpValidation.value;

        // 3. استدعاء الـ .NET API (GET request)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIME_CONSTANTS.REQUEST_TIMEOUT);

        let response;
        try {
            response = await fetch(
                `${API_URL}/api/Auth/verifyUser?userId=${userId}&otp=${cleanOTP}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'langCode': langCode,
                        'X-Client-Type': 'web',
                    },
                    signal: controller.signal,
                }
            );
        } catch (fetchError) {
            clearTimeout(timeoutId);

            if (fetchError.name === 'AbortError') {
                return NextResponse.json(
                    { error: getErrorMessage('TIMEOUT', locale) },
                    { status: 408 }
                );
            }

            return NextResponse.json(
                { error: getErrorMessage('NETWORK', locale) },
                { status: 503 }
            );
        }

        clearTimeout(timeoutId);

        // 4. قراءة الاستجابة
        let data;
        try {
            data = await response.json();
        } catch {
            // لو الـ response مش JSON (زي true)
            data = await response.text();
        }

        // 5. معالجة الأخطاء
        if (!response.ok) {
            const errorMessage = typeof data === 'object'
                ? (data.detail || data.title || data.message || data.error)
                : data;

            return NextResponse.json(
                { error: errorMessage || getErrorMessage('SERVER_ERROR', locale) },
                { status: response.status }
            );
        }

        // 6. نجاح
        return NextResponse.json({
            success: true,
            verified: data === true || data === 'true'
        });

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Verify OTP error:', error);
        }
        return NextResponse.json(
            { error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        );
    }
}