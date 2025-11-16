// app/[locale]/cart/page.js
import { Suspense } from 'react';
import { serverApi } from '@/lib/server-fetch';
import CartClient from '@/components/Cart/CartClient';
import CartSkeleton from './CartSkeleton';
import styles from './cart.module.css';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getShippingOffers } from '@/lib/shipping-offers';

export const metadata = {
  title: 'Shopping Cart',
  description: 'View and manage your shopping cart',
};

export const revalidate = 0;

async function getCartData(locale) {
  const result = await serverApi.get('/api/Cart', {
    locale,
    cache: 'no-store',
    tags: ['cart'],
    timeout: 10000,
  });

  if (result.requiresLogin) {
    return {
      requiresLogin: true,
      error: result.error,
    };
  }

  if (!result.success) {
    return {
      cartProduccts: [],
      cartBundles: [],
      error: result.error || 'Failed to load cart',
    };
  }

  return result.data;
}

export default async function CartPage({ params }) {
  const { locale = 'ar' } = await params;

  // Parallel data fetching - fastest approach
  const [cartData, shippingOffer, dict] = await Promise.all([
    getCartData(locale),
    getShippingOffers(locale),
    getDictionary(locale),
  ]);

  // Handle auth redirect
  if (cartData.requiresLogin) {
    // You might want to redirect to login page
    // redirect(`/${locale}/login?redirect=/cart`);
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>{dict.cart.title}</h1>
        
        {cartData.error && !cartData.requiresLogin ? (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{cartData.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className={styles.retryButton}
            >
              {dict.cart.retry || 'Try Again'}
            </button>
          </div>
        ) : (
          <Suspense fallback={<CartSkeleton />}>
            <CartClient 
              initialData={cartData} 
              locale={locale}
              shippingOffer={shippingOffer}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}