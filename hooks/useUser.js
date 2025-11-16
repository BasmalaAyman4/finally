// hooks/useUser.js
'use client';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export const logout = async (redirectTo = '/') => {
    try {
        await signOut({
            callbackUrl: redirectTo,
            redirect: true
        });
    } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = redirectTo;
    }
};

export function useUser() {
    const { data: session, status } = useSession();
    
    return {
        user: session?.user,
        token: session?.accessToken,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
    };
}

