// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { authLimiter, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeInput, validateMobile } from '@/utils/validations';
import { getErrorMessage, TIME_CONSTANTS } from '@/utils/constants';
import { getLocaleFromLangCode } from '@/utils/locale';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error('API_URL is required in environment variables');
}

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
            const retryMsg = locale === 'ar'
                ? `${errorMsg}. حاول مرة أخرى بعد ${rateLimit.retryAfter} ثانية`
                : `${errorMsg}. Try again after ${rateLimit.retryAfter} seconds`;
            return NextResponse.json(
               
                { error: retryMsg },
                {
                    status: 429,
                    headers: {
                        'Retry-After': rateLimit.retryAfter.toString(),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            );
        }

        // 2. قراءة البيانات
        const body = await request.json().catch(() => ({}));
        const { mobile, password, langCode = '1' } = body;

        const locale = getLocaleFromLangCode(langCode);

        // Validate mobile
        const mobileValidation = validateMobile(mobile);
        if (!mobileValidation.valid) {
            return NextResponse.json(
                { error: mobileValidation.error },
                { status: 400 }
            );
        }

        const cleanMobile = mobileValidation.value;
        const cleanPassword = sanitizeInput(password);

        if (!cleanMobile || !cleanPassword) {
            return NextResponse.json(
                { error: getErrorMessage('VALIDATION', locale) },
                { status: 400 }
            );
        }

        // 3. استدعاء الـ .NET API مع timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIME_CONSTANTS.REQUEST_TIMEOUT);

        let response;
        try {
            response = await fetch(`${API_URL}/api/Auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'langCode': langCode,
                    'X-Client-Type': 'web',
                },
                body: JSON.stringify({
                    mobile: cleanMobile,
                    password: cleanPassword
                }),
                signal: controller.signal,
            });
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
            return NextResponse.json(
                { error: getErrorMessage('SERVER_ERROR', locale) },
                { status: 500 }
            );
        }
console.log(data,'data')

        // 5. معالجة الأخطاء
        if (!response.ok) {
            const errorMessage =
                data.detail || data.title || data.message || data.error ||
                getErrorMessage('SERVER_ERROR', locale);

            return NextResponse.json(
                { error: errorMessage },
                {
                    status: response.status,
                    headers: {
                        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                    },
                }
            );
        }

        // 6. نجاح - إعادة تعيين rate limit
        authLimiter.reset(identifier);

        return NextResponse.json(
            { success: true, user: data },
            {
                headers: {
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                },
            }
        );
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Unexpected error:', error);
        }
        return NextResponse.json(
            { error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        );
    }
}