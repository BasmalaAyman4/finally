/* // hooks/useCart.js
'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export const useCart = (locale = 'ar') => {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const abortControllerRef = useRef(null);

  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  /**
   * Ensure we have a fresh token before making requests
   *
  const ensureFreshToken = useCallback(async () => {
    if (!session?.accessToken) {
      return null;
    }

    const tokenExpires = session.accessTokenExpires || 0;
    const isExpiring = Date.now() >= tokenExpires - 2 * 60 * 1000; // 2 min buffer

    if (isExpiring) {
      console.log('🔄 Token expiring, refreshing before request...');
      try {
        await update();
        // Get updated session
        const { data: updatedSession } = useSession();
        return updatedSession?.accessToken;
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
        return null;
      }
    }

    return session.accessToken;
  }, [session, update]);

  const addToCart = useCallback(
    async (productDetailId, qty = 1) => {
      setError(null);
      setErrorDetails(null);

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Check authentication
      if (!isAuthenticated) {
        const errorMsg = locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must log in first';
        setError(errorMsg);
        setErrorDetails({ type: 'AUTH_REQUIRED' });
        return {
          success: false,
          error: errorMsg,
          shouldRedirect: true,
        };
      }

      // Validate inputs
      if (!productDetailId || productDetailId <= 0) {
        const errorMsg = locale === 'ar' ? 'منتج غير صالح' : 'Invalid product';
        setError(errorMsg);
        setErrorDetails({ type: 'INVALID_PRODUCT' });
        return { success: false, error: errorMsg };
      }

      if (!qty || qty <= 0) {
        const errorMsg = locale === 'ar' ? 'كمية غير صالحة' : 'Invalid quantity';
        setError(errorMsg);
        setErrorDetails({ type: 'INVALID_QUANTITY' });
        return { success: false, error: errorMsg };
      }

      setIsLoading(true);

      // Ensure we have a fresh token
      const token = await ensureFreshToken();
      if (!token) {
        const errorMsg = locale === 'ar' ? 'انتهت صلاحية الجلسة' : 'Session expired';
        setError(errorMsg);
        setErrorDetails({ type: 'TOKEN_EXPIRED' });
        setIsLoading(false);
        return {
          success: false,
          error: errorMsg,
          shouldRedirect: true,
        };
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        console.log('🛒 Adding to cart:', { productDetailId, qty, locale });

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productDetailId,
            qty,
            locale,
          }),
          signal: abortControllerRef.current.signal,
        });

        console.log('📡 Cart API response status:', response.status);

        // Parse response
        const result = await response.json();
        console.log('📦 Parsed result:', result);

        if (!response.ok) {
          // Handle 401 specifically
          if (response.status === 401) {
            const errorMsg = locale === 'ar' 
              ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
              : 'Session expired. Please log in again.';
            
            setError(errorMsg);
            setErrorDetails({
              detail: result.detail,
              type: 'AUTH_EXPIRED',
              status: 401
            });

            return {
              success: false,
              error: errorMsg,
              shouldRedirect: true,
              status: 401
            };
          }

          const errorMsg = result.error ||
            (locale === 'ar' ? 'فشل إضافة المنتج إلى السلة' : 'Failed to add product to cart');

          setError(errorMsg);
          setErrorDetails({
            detail: result.detail,
            type: result.errorCode || result.type,
            traceId: result.traceId,
            status: result.status
          });

          return {
            success: false,
            error: errorMsg,
            details: result.detail,
            type: result.errorCode,
            status: response.status
          };
        }

        if (result.success) {
          console.log('✅ Added to cart successfully');
          return {
            success: true,
            data: result.data,
            message: result.message
          };
        } else {
          const errorMsg = result.error ||
            (locale === 'ar' ? 'فشل إضافة المنتج إلى السلة' : 'Failed to add product to cart');

          setError(errorMsg);
          setErrorDetails({
            detail: result.detail,
            type: result.errorCode
          });

          return {
            success: false,
            error: errorMsg,
            details: result.detail
          };
        }
      } catch (err) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          console.log('Request aborted');
          return { success: false, error: 'Request cancelled' };
        }

        console.error('💥 Cart fetch error:', err);
        const errorMsg = err.message ||
          (locale === 'ar' ? 'حدث خطأ أثناء الإضافة إلى السلة' : 'An error occurred while adding to cart');

        setError(errorMsg);
        setErrorDetails({
          type: 'NETWORK_ERROR',
          detail: err.message
        });

        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isAuthenticated, locale, ensureFreshToken]
  );

  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  const redirectToLogin = useCallback(() => {
    router.push(`/${locale}/signin`);
  }, [router, locale]);

  // Cleanup on unmount
  useCallback(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    addToCart,
    isLoading,
    error,
    errorDetails,
    clearError,
    redirectToLogin,
    isAuthenticated,
  };
}; */
/* 
// hooks/useCart.js
'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export const useCart = (locale = 'ar') => {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const abortControllerRef = useRef(null);

  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  /**
   * Ensure we have a fresh token before making requests
   * FIXED: Properly await update and return the token from current session
   *
  const ensureFreshToken = useCallback(async () => {
    if (!session?.accessToken) {
      return null;
    }

    const tokenExpires = session.accessTokenExpires || 0;
    const isExpiring = Date.now() >= tokenExpires - 2 * 60 * 1000; // 2 min buffer

    if (isExpiring) {
      console.log('🔄 Token expiring, refreshing before request...');
      try {
        // IMPORTANT: update() triggers NextAuth to refresh the token
        // The updated session will be available in the next render
        const updatedSession = await update();
        
        // Return the token from the updated session
        return updatedSession?.accessToken || null;
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
        return null;
      }
    }

    return session.accessToken;
  }, [session, update]);

  const addToCart = useCallback(
    async (productDetailId, qty = 1) => {
      setError(null);
      setErrorDetails(null);

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Check authentication
      if (!isAuthenticated) {
        const errorMsg = locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must log in first';
        setError(errorMsg);
        setErrorDetails({ type: 'AUTH_REQUIRED' });
        return {
          success: false,
          error: errorMsg,
          shouldRedirect: true,
        };
      }

      // Validate inputs
      if (!productDetailId || productDetailId <= 0) {
        const errorMsg = locale === 'ar' ? 'منتج غير صالح' : 'Invalid product';
        setError(errorMsg);
        setErrorDetails({ type: 'INVALID_PRODUCT' });
        return { success: false, error: errorMsg };
      }

      if (!qty || qty <= 0) {
        const errorMsg = locale === 'ar' ? 'كمية غير صالحة' : 'Invalid quantity';
        setError(errorMsg);
        setErrorDetails({ type: 'INVALID_QUANTITY' });
        return { success: false, error: errorMsg };
      }

      setIsLoading(true);

      // Ensure we have a fresh token
      const token = await ensureFreshToken();
      if (!token) {
        const errorMsg = locale === 'ar' ? 'انتهت صلاحية الجلسة' : 'Session expired';
        setError(errorMsg);
        setErrorDetails({ type: 'TOKEN_EXPIRED' });
        setIsLoading(false);
        return {
          success: false,
          error: errorMsg,
          shouldRedirect: true,
        };
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        console.log('🛒 Adding to cart:', { productDetailId, qty, locale });

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productDetailId,
            qty,
            locale,
          }),
          signal: abortControllerRef.current.signal,
        });

        console.log('📡 Cart API response status:', response.status);

        // Parse response
        const result = await response.json();
        console.log('📦 Parsed result:', result);

        if (!response.ok) {
          // Handle 401 specifically - token might have expired during the request
          if (response.status === 401) {
            const errorMsg = locale === 'ar' 
              ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
              : 'Session expired. Please log in again.';
            
            setError(errorMsg);
            setErrorDetails({
              detail: result.detail,
              type: 'AUTH_EXPIRED',
              status: 401
            });

            return {
              success: false,
              error: errorMsg,
              shouldRedirect: true,
              status: 401
            };
          }

          const errorMsg = result.error ||
            (locale === 'ar' ? 'فشل إضافة المنتج إلى السلة' : 'Failed to add product to cart');

          setError(errorMsg);
          setErrorDetails({
            detail: result.detail,
            type: result.errorCode || result.type,
            traceId: result.traceId,
            status: result.status
          });

          return {
            success: false,
            error: errorMsg,
            details: result.detail,
            type: result.errorCode,
            status: response.status
          };
        }

        if (result.success) {
          console.log('✅ Added to cart successfully');
          return {
            success: true,
            data: result.data,
            message: result.message
          };
        } else {
          const errorMsg = result.error ||
            (locale === 'ar' ? 'فشل إضافة المنتج إلى السلة' : 'Failed to add product to cart');

          setError(errorMsg);
          setErrorDetails({
            detail: result.detail,
            type: result.errorCode
          });

          return {
            success: false,
            error: errorMsg,
            details: result.detail
          };
        }
      } catch (err) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          console.log('Request aborted');
          return { success: false, error: 'Request cancelled' };
        }

        console.error('💥 Cart fetch error:', err);
        const errorMsg = err.message ||
          (locale === 'ar' ? 'حدث خطأ أثناء الإضافة إلى السلة' : 'An error occurred while adding to cart');

        setError(errorMsg);
        setErrorDetails({
          type: 'NETWORK_ERROR',
          detail: err.message
        });

        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isAuthenticated, locale, ensureFreshToken]
  );

  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  const redirectToLogin = useCallback(() => {
    router.push(`/${locale}/signin`);
  }, [router, locale]);

  return {
    addToCart,
    isLoading,
    error,
    errorDetails,
    clearError,
    redirectToLogin,
    isAuthenticated,
  };
}; */
// hooks/useCart.js
'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export const useCart = (locale = 'ar') => {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const abortControllerRef = useRef(null);
  const refreshPromiseRef = useRef(null); // Prevent duplicate refreshes

  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  /**
   * FIXED: Ensure we have a fresh token before making requests
   * Now properly waits for token refresh and returns the new token
   */
  const ensureFreshToken = useCallback(async () => {
    if (!session?.accessToken) {
      console.log('❌ No session or access token');
      return null;
    }

    const tokenExpires = session.accessTokenExpires || 0;
    const now = Date.now();
    const timeUntilExpiry = tokenExpires - now;

    // If token expires in 3 minutes or less (or already expired), refresh it
    const needsRefresh = timeUntilExpiry <= 3 * 60 * 1000;

    if (needsRefresh) {
      console.log(`🔄 Token needs refresh (expires in ${Math.floor(timeUntilExpiry / 1000)}s)`);

      // If a refresh is already in progress, wait for it
      if (refreshPromiseRef.current) {
        console.log('⏳ Waiting for ongoing refresh...');
        try {
          await refreshPromiseRef.current;
        } catch (error) {
          console.error('❌ Refresh failed:', error);
          return null;
        }
      } else {
        // Start a new refresh
        refreshPromiseRef.current = (async () => {
          try {
            console.log('🔄 Starting token refresh...');
            const updatedSession = await update();

            if (!updatedSession?.accessToken) {
              console.error('❌ No token in updated session');
              return null;
            }

            if (updatedSession.error === "RefreshAccessTokenError") {
              console.error('❌ Token refresh failed');
              return null;
            }

            console.log('✅ Token refreshed successfully');
            return updatedSession.accessToken;
          } finally {
            // Clear the promise reference after completion
            refreshPromiseRef.current = null;
          }
        })();

        try {
          const newToken = await refreshPromiseRef.current;
          return newToken;
        } catch (error) {
          console.error('❌ Failed to refresh token:', error);
          return null;
        }
      }
    }

    // Token is still valid
    return session.accessToken;
  }, [session, update]);

  const addToCart = useCallback(
    async (productDetailId, qty = 1) => {
      setError(null);
      setErrorDetails(null);

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Check authentication
      if (!isAuthenticated) {
        const errorMsg = locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must log in first';
        setError(errorMsg);
        setErrorDetails({ type: 'AUTH_REQUIRED' });
        return {
          success: false,
          error: errorMsg,
          shouldRedirect: true,
        };
      }

      // Validate inputs
      if (!productDetailId || productDetailId <= 0) {
        const errorMsg = locale === 'ar' ? 'منتج غير صالح' : 'Invalid product';
        setError(errorMsg);
        setErrorDetails({ type: 'INVALID_PRODUCT' });
        return { success: false, error: errorMsg };
      }

      if (!qty || qty <= 0) {
        const errorMsg = locale === 'ar' ? 'كمية غير صالحة' : 'Invalid quantity';
        setError(errorMsg);
        setErrorDetails({ type: 'INVALID_QUANTITY' });
        return { success: false, error: errorMsg };
      }

      setIsLoading(true);

      // CRITICAL: Ensure we have a fresh token
      const token = await ensureFreshToken();

      if (!token) {
        const errorMsg = locale === 'ar' ? 'انتهت صلاحية الجلسة' : 'Session expired';
        setError(errorMsg);
        setErrorDetails({ type: 'TOKEN_EXPIRED' });
        setIsLoading(false);
        return {
          success: false,
          error: errorMsg,
          shouldRedirect: true,
        };
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        console.log('🛒 Adding to cart:', { productDetailId, qty, locale });

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productDetailId,
            qty,
            locale,
          }),
          signal: abortControllerRef.current.signal,
        });

        console.log('📡 Cart API response status:', response.status);

        // Parse response
        const result = await response.json();

        if (!response.ok) {
          // Handle 401 specifically - token expired during request
          if (response.status === 401) {
            const errorMsg = locale === 'ar'
              ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
              : 'Session expired. Please log in again.';

            setError(errorMsg);
            setErrorDetails({
              detail: result.detail,
              type: 'AUTH_EXPIRED',
              status: 401
            });

            return {
              success: false,
              error: errorMsg,
              shouldRedirect: true,
              status: 401
            };
          }

          const errorMsg = result.error ||
            (locale === 'ar' ? 'فشل إضافة المنتج إلى السلة' : 'Failed to add product to cart');

          setError(errorMsg);
          setErrorDetails({
            detail: result.detail,
            type: result.errorCode || result.type,
            traceId: result.traceId,
            status: result.status
          });

          return {
            success: false,
            error: errorMsg,
            details: result.detail,
            type: result.errorCode,
            status: response.status
          };
        }

        if (result.success) {
          console.log('✅ Added to cart successfully');
          return {
            success: true,
            data: result.data,
            message: result.message
          };
        } else {
          const errorMsg = result.error ||
            (locale === 'ar' ? 'فشل إضافة المنتج إلى السلة' : 'Failed to add product to cart');

          setError(errorMsg);
          setErrorDetails({
            detail: result.detail,
            type: result.errorCode
          });

          return {
            success: false,
            error: errorMsg,
            details: result.detail
          };
        }
      } catch (err) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          console.log('Request aborted');
          return { success: false, error: 'Request cancelled' };
        }

        console.error('💥 Cart fetch error:', err);
        const errorMsg = err.message ||
          (locale === 'ar' ? 'حدث خطأ أثناء الإضافة إلى السلة' : 'An error occurred while adding to cart');

        setError(errorMsg);
        setErrorDetails({
          type: 'NETWORK_ERROR',
          detail: err.message
        });

        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isAuthenticated, locale, ensureFreshToken]
  );

  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  const redirectToLogin = useCallback(() => {
    router.push(`/${locale}/signin`);
  }, [router, locale]);

  return {
    addToCart,
    isLoading,
    error,
    errorDetails,
    clearError,
    redirectToLogin,
    isAuthenticated,
  };
};