'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Component لحماية الصفحات - يتطلب تسجيل الدخول
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading, requireAuth } = useAuth();

    useEffect(() => {
        requireAuth();
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return children;
}