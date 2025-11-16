// hooks/useAuth.js
'use client';

import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { locale } = useLocale();

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const login = useCallback(async (mobile, password, langCode) => {
        if (loading) return { success: false };

        setLoading(true);
        setError(null);

        try {
            // 1. استدعاء Next.js API Route
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobile,
                    password,
                    langCode,
                }),
            });
console.log(response)
            const data = await response.json();

            // 2. لو فيه error من الـ API
            if (!response.ok) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('API error:', data);
                }

                const errorMessage = data.error || 'فشل تسجيل الدخول';
                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                    details: data.details,
                };
            }

            // 3. Sign in with NextAuth
            const result = await signIn('credentials', {
                redirect: false,
                mobile,
                password,
                locale,
            });

            if (result?.error) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('NextAuth error:', result.error);
                }
                const errorMsg = 'فشل في إنشاء الجلسة';
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }

            if (result?.ok) {
                // Small delay لضمان الـ session
                await new Promise(resolve => setTimeout(resolve, 100));

                // Redirect
                const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
                const redirectUrl = callbackUrl || `/${locale}`;

                router.push(redirectUrl);
                router.refresh();

                return { success: true };
            }

            return { success: false, error: 'فشل تسجيل الدخول' };

        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Login exception:', err);
            }
            const errorMsg = 'حدث خطأ في الاتصال';
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, [loading, router, locale]);

    return {
        loading,
        error,
        clearError,
        login,
    };
};