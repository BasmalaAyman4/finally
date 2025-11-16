// app/api/auth/set-password/route.js
import { NextResponse } from 'next/server';
import { authLimiter, getClientIdentifier } from '@/lib/rate-limit';
import { sanitizeInput, validatePassword } from '@/utils/validations';
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
                { status: 429 }
            );
        }

        // 2. قراءة البيانات
        const body = await request.json().catch(() => ({}));
        const { userId, password, langCode = '1' } = body;

        const locale = getLocaleFromLangCode(langCode);

        // Validate
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { error: passwordValidation.error },
                { status: 400 }
            );
        }

        const cleanPassword = sanitizeInput(password);

        // 3. استدعاء الـ .NET API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIME_CONSTANTS.REQUEST_TIMEOUT);

        let response;
        try {
            response = await fetch(`${API_URL}/api/Auth/setPassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'langCode': langCode,
                    'X-Client-Type': 'web',
                },
                body: JSON.stringify({
                    userId: userId,
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

        // 5. معالجة الأخطاء
        if (!response.ok) {
            const errorMessage =
                data.detail || data.title || data.message || data.error ||
                getErrorMessage('SERVER_ERROR', locale);

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            );
        }

        // 6. نجاح - إرجاع كل البيانات (userId, token, userName, etc.)
        return NextResponse.json({
            success: true,
            userData: {
                userId: data.userId,
                userName: data.userName,
                lastMobileDigit: data.lastMobileDigit,
                token: data.token,
                verify: data.verify,
                createdDate: data.createdDate,
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                isSeller: data.isSeller
            }
        });

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Set password error:', error);
        }
        return NextResponse.json(
            { error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        );
    }
}