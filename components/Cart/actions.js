'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { serverApi } from '@/lib/server-fetch';

// Centralized error handler
function handleCartError(error, action) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Cart: ${action}]`, error.message);
  }

  return {
    success: false,
    error: error.detail || error.message || `Failed to ${action}`,
    status: error.status || 500,
  };
}

// Centralized revalidation
function revalidateCart(locale) {
  revalidateTag('cart');
  revalidatePath(`/${locale}/cart`);
  revalidatePath(`/${locale}/checkout`, 'page');
}

// Generic cart operation
async function executeCartOperation(operation, locale, action) {
  try {
    const result = await operation();

    if (result.success) {
      revalidateCart(locale);
      return { success: true, data: result.data };
    }

    return handleCartError(result, action);
  } catch (error) {
    return handleCartError(error, action);
  }
}

// Public API
export async function incrementCartItem(id, locale = 'ar') {
  return executeCartOperation(
    () => serverApi.put(`api/Cart/increment/${id}`, null, {
      locale,
      cache: 'no-store',
      timeout: 8000,
    }),
    locale,
    'increment'
  );
}

export async function decrementCartItem(id, locale = 'ar') {
  return executeCartOperation(
    () => serverApi.put(`api/Cart/decrement/${id}`, null, {
      locale,
      cache: 'no-store',
      timeout: 8000,
    }),
    locale,
    'decrement'
  );
}

export async function deleteCartItem(id, locale = 'ar') {
  return executeCartOperation(
    () => serverApi.delete(`api/Cart/${id}`, {
      locale,
      cache: 'no-store',
      timeout: 8000,
    }),
    locale,
    'delete'
  );
}

export async function batchUpdateCart(operations, locale = 'ar') {
  try {
    const results = await Promise.allSettled(
      operations.map(({ id, action }) => {
        switch (action) {
          case 'increment':
            return serverApi.put(`api/Cart/increment/${id}`, null, { locale, cache: 'no-store' });
          case 'decrement':
            return serverApi.put(`api/Cart/decrement/${id}`, null, { locale, cache: 'no-store' });
          case 'delete':
            return serverApi.delete(`api/Cart/${id}`, { locale, cache: 'no-store' });
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      })
    );

    const hasSuccess = results.some(r => r.status === 'fulfilled' && r.value.success);

    if (hasSuccess) {
      revalidateCart(locale);
    }

    const processed = results.map((result, i) => ({
      id: operations[i].id,
      success: result.status === 'fulfilled' && result.value.success,
      error: result.status === 'rejected' ? result.reason.message : null,
    }));

    return {
      success: hasSuccess,
      results: processed,
      failedCount: processed.filter(r => !r.success).length,
      successCount: processed.filter(r => r.success).length,
    };
  } catch (error) {
    return handleCartError(error, 'batch update');
  }
}

export async function clearCart(locale = 'ar') {
  return executeCartOperation(
    () => serverApi.delete('api/Cart/clear', {
      locale,
      cache: 'no-store',
      timeout: 10000,
    }),
    locale,
    'clear cart'
  );
}