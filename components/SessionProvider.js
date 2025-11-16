/* 'use client';

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from 'next-auth/react';
import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

function SessionWatcher() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const refreshIntervalRef = useRef(null);
  const lastRefreshRef = useRef(Date.now());

  // Handle refresh token error
  const handleTokenError = useCallback(async () => {
    console.warn("⚠️ Token refresh failed. Redirecting to login...");
    await signOut({ 
      redirect: true,
      callbackUrl: '/ar/signin'
    });
  }, []);

  // Proactive token refresh
  const refreshToken = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    const now = Date.now();
    if (now - lastRefreshRef.current < 30000) { // 30 seconds cooldown
      return;
    }

    lastRefreshRef.current = now;

    try {
      console.log('🔄 Triggering session update...');
      await update();
      console.log('✅ Session updated successfully');
    } catch (error) {
      console.error('❌ Session update failed:', error);
    }
  }, [update]);

  // Monitor session and handle errors
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.error === "RefreshAccessTokenError") {
        handleTokenError();
        return;
      }

      // Check token expiration
      const tokenExpires = session?.accessTokenExpires || 0;
      const timeUntilExpiry = tokenExpires - Date.now();
      
      // If token expires in less than 5 minutes, refresh now
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        console.log(`⏰ Token expiring in ${Math.floor(timeUntilExpiry / 60000)} minutes, refreshing...`);
        refreshToken();
      }

      // Set up periodic refresh (every 5 minutes)
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(() => {
        refreshToken();
      }, 5 * 60 * 1000); // Every 5 minutes
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [session, status, refreshToken, handleTokenError]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        console.log('🪟 Window focused, checking session...');
        refreshToken();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, refreshToken]);

  return null;
}

export default function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={5 * 60} // Check every 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <SessionWatcher />
      {children}
    </NextAuthSessionProvider>
  );
} */

'use client';

import { SessionProvider as NextAuthSessionProvider, useSession, signOut } from 'next-auth/react';
import { useEffect, useCallback, useRef } from 'react';

function SessionWatcher() {
  const { data: session, status, update } = useSession();
  const refreshIntervalRef = useRef(null);
  const lastRefreshRef = useRef(0);
  const isRefreshingRef = useRef(false);

  // Handle refresh token error
  const handleTokenError = useCallback(async () => {
    console.warn("⚠️ Token refresh failed. Redirecting to login...");
    await signOut({
      redirect: true,
      callbackUrl: '/ar/signin'
    });
  }, []);

  // FIXED: Proactive token refresh with proper locking
  const refreshToken = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }

    const now = Date.now();
    // Minimum 30 seconds between refresh attempts
    if (now - lastRefreshRef.current < 30000) {
      console.log('⏱️ Too soon to refresh again');
      return;
    }

    // Check if refresh is actually needed
    const tokenExpires = session?.accessTokenExpires || 0;
    const timeUntilExpiry = tokenExpires - now;

    // Only refresh if token expires in less than 5 minutes
    if (timeUntilExpiry > 5 * 60 * 1000) {
      console.log(`✓ Token still valid for ${Math.floor(timeUntilExpiry / 60000)} minutes`);
      return;
    }

    isRefreshingRef.current = true;
    lastRefreshRef.current = now;

    try {
      console.log('🔄 Triggering session update...');
      const updatedSession = await update();

      if (updatedSession?.error === "RefreshAccessTokenError") {
        console.error('❌ Session update returned error');
        await handleTokenError();
        return;
      }

      console.log('✅ Session updated successfully');
    } catch (error) {
      console.error('❌ Session update failed:', error);
      await handleTokenError();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [session?.accessTokenExpires, update, handleTokenError]);

  // FIXED: Monitor session and schedule refreshes
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    // Handle refresh errors
    if (session?.error === "RefreshAccessTokenError") {
      handleTokenError();
      return;
    }

    // Check token expiration
    const tokenExpires = session?.accessTokenExpires || 0;
    const now = Date.now();
    const timeUntilExpiry = tokenExpires - now;

    // If token expires in less than 5 minutes, refresh immediately
    if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
      console.log(`⏰ Token expiring soon (${Math.floor(timeUntilExpiry / 60000)}m), refreshing...`);
      refreshToken();
    }

    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up periodic check every 2 minutes (instead of 5)
    // This ensures we catch expiring tokens more reliably
    refreshIntervalRef.current = setInterval(() => {
      refreshToken();
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [session, status, refreshToken, handleTokenError]);

  // FIXED: Refresh on window focus (but respect cooldown)
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        console.log('🪟 Window focused, checking session...');

        // Only refresh if last refresh was more than 1 minute ago
        const now = Date.now();
        if (now - lastRefreshRef.current > 60000) {
          refreshToken();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, refreshToken]);

  // NEW: Refresh on network reconnect
  useEffect(() => {
    const handleOnline = () => {
      if (status === 'authenticated') {
        console.log('🌐 Network reconnected, checking session...');
        refreshToken();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [status, refreshToken]);

  return null;
}

export default function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={2 * 60} // Check every 2 minutes (more frequent)
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <SessionWatcher />
      {children}
    </NextAuthSessionProvider>
  );
}