// hooks/useSignup.js
'use client';

import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';

export const useSignup = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { locale, langCode } = useLocale();

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Step 1: Register mobile number
     */
    const registerMobile = useCallback(async (mobile) => {
        if (loading) return { success: false };

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobile,
                    langCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Register mobile error:', data);
                }

                const errorMessage = data.error || 'فشل التسجيل';
                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                };
            }

            return {
                success: true,
                userId: data.userId
            };

        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Register mobile exception:', err);
            }
            const errorMsg = 'حدث خطأ في الاتصال';
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, [loading, langCode]);

    /**
     * Step 2: Verify OTP
     */
    const verifyOTP = useCallback(async (userId, otp) => {
        if (loading) return { success: false };

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    otp,
                    langCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Verify OTP error:', data);
                }

                const errorMessage = data.error || 'كود التحقق غير صحيح';
                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                };
            }

            return { success: true };

        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Verify OTP exception:', err);
            }
            const errorMsg = 'حدث خطأ في الاتصال';
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, [loading, langCode]);

    /**
     * Step 3: Set password
     */
    const setPassword = useCallback(async (userId, password) => {
        if (loading) return { success: false };

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    password,
                    langCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Set password error:', data);
                }

                const errorMessage = data.error || 'فشل تعيين كلمة المرور';
                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                };
            }

            return {
                success: true,
                userData: data.userData
            };

        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Set password exception:', err);
            }
            const errorMsg = 'حدث خطأ في الاتصال';
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, [loading, langCode]);

    /**
     * Step 4: Complete profile
     */
    const completeProfile = useCallback(async (token, personalData) => {
        if (loading) return { success: false };

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/complete-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    ...personalData,
                    langCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Complete profile error:', data);
                }

                const errorMessage = data.error || 'فشل إكمال البيانات';
                setError(errorMessage);

                return {
                    success: false,
                    error: errorMessage,
                    errors: data.errors,
                };
            }

            return {
                success: true,
                user: data.user
            };

        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Complete profile exception:', err);
            }
            const errorMsg = 'حدث خطأ في الاتصال';
            setError(errorMsg);
            return { success: false, error: errorMsg };

        } finally {
            setLoading(false);
        }
    }, [loading, langCode]);

    /**
     * Auto login after signup
     */
    const autoLogin = useCallback(async (userData) => {
        try {
            const result = await signIn('credentials', {
                redirect: false,
                mobile: userData.mobile,
                password: userData.password, // مش محتاجين password هنا
                locale,
            });

            if (result?.ok) {
                // Redirect to home
                await new Promise(resolve => setTimeout(resolve, 100));
                router.push(`/${locale}`);
                router.refresh();
                return { success: true };
            }

            return { success: false };

        } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Auto login exception:', err);
            }
            return { success: false };
        }
    }, [locale, router]);

    return {
        loading,
        error,
        clearError,
        registerMobile,
        verifyOTP,
        setPassword,
        completeProfile,
        autoLogin,
    };
};