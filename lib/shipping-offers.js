// lib/shipping-offers.js
// Server-side shipping offer utilities

import { serverApi } from '@/lib/server-fetch';

/**
 * Server-side fetch - cacheable and reusable
 */
export async function getShippingOffers(locale = 'ar') {
  try {
    const result = await serverApi.get('api/ShippingOffer', {
      locale,
      cache: 'force-cache', // Cache for performance
      next: { revalidate: 3600 }, // Revalidate every hour
      timeout: 5000,
    });

    if (result.success && result.data?.[0]) {
      return normalizeShippingOffer(result.data[0]);
    }
  } catch (err) {
    console.error('[Shipping Offers] Fetch error:', err);
  }
  
  // Always return default fallback
  return getDefaultOffer();
}

/**
 * Calculate shipping with proper type safety
 */
export function calculateShipping(subtotal, shippingOffer, baseDeliveryFee = 0) {
  const offer = shippingOffer || getDefaultOffer();
  const qualifiesForDiscount = subtotal >= offer.orderMinValue;

  let deliveryFee = baseDeliveryFee;
  let discount = 0;

  if (qualifiesForDiscount) {
    discount = offer.isPercentage
      ? (baseDeliveryFee * offer.discountValue) / 100
      : offer.discountValue;
    deliveryFee = Math.max(0, baseDeliveryFee - discount);
  }

  const amountUntilFreeShipping = Math.max(0, offer.orderMinValue - subtotal);
  const progressPercentage = Math.min(100, (subtotal / offer.orderMinValue) * 100);

  return {
    deliveryFee,
    shippingDiscount: discount,
    qualifiesForDiscount,
    amountUntilFreeShipping,
    progressPercentage,
    threshold: offer.orderMinValue,
    discountText: offer.discountText,
  };
}

// Helpers
function normalizeShippingOffer(offer) {
  return {
    orderMinValue: offer.orderMinValue || 800,
    discountValue: offer.value || 60,
    discountText: offer.valueText || '60 %',
    isPercentage: offer.valueText?.includes('%') ?? true,
  };
}

function getDefaultOffer() {
  return {
    orderMinValue: 800,
    discountValue: 60,
    discountText: '60 %',
    isPercentage: true,
  };
}