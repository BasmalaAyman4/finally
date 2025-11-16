// app/[locale]/checkout/page.jsx
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import CheckoutClient from '@/components/checkout/CheckoutClient';
import CheckoutSkeleton from '@/components/checkout/CheckoutSkeleton';
import { serverApi } from '@/lib/server-fetch';

/**
 * Fetch checkout data and addresses in parallel
 * Using Promise.allSettled for better error handling
 */
async function getCheckoutData(cartIds, locale) {
  const queryParams = new URLSearchParams();
  cartIds.forEach(id => queryParams.append('CartIds', id));
  
  const [checkoutResult, addressesResult] = await Promise.allSettled([
    serverApi.get(`api/Checkout/getCheckoutBasicData?${queryParams}`, {
      locale,
      cache: 'no-store', // Always fresh data for checkout
      tags: ['checkout']
    }),
    serverApi.get('api/UserAddress', {
      locale,
      cache: 'no-store', // Fresh addresses
      tags: ['addresses']
    })
  ]);

  // Handle checkout data (critical)
  const checkoutData = checkoutResult.status === 'fulfilled' 
    ? checkoutResult.value 
    : { success: false, error: 'Failed to load checkout data' };

  // Handle addresses (non-critical, can be empty)
  const addresses = addressesResult.status === 'fulfilled' && 
    addressesResult.value.success
    ? addressesResult.value.data || []
    : [];

  return { checkoutData, addresses };
}

/**
 * Validate cart IDs from query params
 */
function validateCartIds(cartIds) {
  if (!cartIds) return null;
  
  const idsArray = Array.isArray(cartIds) ? cartIds : [cartIds];
  
  if (idsArray.length === 0) return null;
  
  // Filter valid numeric IDs
  const validIds = idsArray
    .map(id => parseInt(id, 10))
    .filter(id => !isNaN(id) && id > 0);
  
  return validIds.length > 0 ? validIds : null;
}

export default async function CheckoutPage({ params, searchParams }) {
  const { locale } = await params;
  const resolvedParams = await searchParams;
  const { CartIds } = resolvedParams;

  // Validate and parse cart IDs
  const cartIdsArray = validateCartIds(CartIds);
  
  if (!cartIdsArray) {
    redirect(`/${locale}/cart`);
  }

  // Fetch data in parallel
  const { checkoutData, addresses } = await getCheckoutData(
    cartIdsArray, 
    locale
  );

  // Handle API errors gracefully
  if (!checkoutData.success) {
    return (
      <CheckoutClient
        locale={locale}
        data={null}
        addresses={[]}
        cartIds={cartIdsArray}
        error={
          checkoutData.error || 
          checkoutData.detail || 
          'Unable to load checkout data'
        }
      />
    );
  }

  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutClient
        locale={locale}
        data={checkoutData.data}
        addresses={addresses}
        cartIds={cartIdsArray}
        error={null}
      />
    </Suspense>
  );
}

// Metadata for SEO
export async function generateMetadata({ params }) {
  const { locale } = await params;
  
  return {
    title: locale === 'ar' ? 'إتمام الطلب' : 'Checkout',
    description: locale === 'ar' 
      ? 'أكمل طلبك واختر طريقة الدفع والعنوان' 
      : 'Complete your order and choose payment method and address',
    robots: 'noindex, nofollow', // Don't index checkout pages
  };
}