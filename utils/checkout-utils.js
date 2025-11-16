// utils/checkout-utils.js

/**
 * Validate cart IDs
 */
export function validateCartIds(cartIds) {
    if (!cartIds) return { valid: false, error: 'No cart items selected' };
    
    const idsArray = Array.isArray(cartIds) ? cartIds : [cartIds];
    
    if (idsArray.length === 0) {
      return { valid: false, error: 'No cart items selected' };
    }
    
    // Check if all IDs are valid numbers
    const hasInvalidIds = idsArray.some(id => {
      const numId = parseInt(id, 10);
      return isNaN(numId) || numId <= 0;
    });
    
    if (hasInvalidIds) {
      return { valid: false, error: 'Invalid cart item IDs' };
    }
    
    return { valid: true, ids: idsArray.map(id => parseInt(id, 10)) };
  }
  
  /**
   * Calculate shipping fee based on offers
   */
  export function calculateShipping(subtotal, shippingOffers, baseShippingFee = 50) {
    if (!shippingOffers || shippingOffers.length === 0) {
      return {
        fee: baseShippingFee,
        discount: 0,
        qualified: false,
        offer: null
      };
    }
    
    const offer = shippingOffers[0];
    const qualified = subtotal >= offer.orderMinValue;
    const discount = qualified ? (offer.value / 100) * baseShippingFee : 0;
    const fee = baseShippingFee - discount;
    
    return {
      fee: Math.max(fee, 0),
      discount,
      qualified,
      offer
    };
  }
  
  /**
   * Calculate wallet deduction
   */
  export function calculateWalletDeduction(subtotal, walletBalance, useWallet) {
    if (!useWallet || walletBalance <= 0) return 0;
    return Math.min(walletBalance, subtotal);
  }
  
  /**
   * Calculate points deduction
   * Points can be used for max 10% of subtotal
   */
  export function calculatePointsDeduction(subtotal, pointsBalance, usePoints, pointRate = 0.15) {
    if (!usePoints || pointsBalance <= 0) return 0;
    
    const maxPointsValue = subtotal * 0.1; // Max 10% from points
    const pointsValue = pointsBalance * pointRate;
    
    return Math.min(pointsValue, maxPointsValue, subtotal);
  }
  
  /**
   * Calculate order total
   */
  export function calculateOrderTotal(
    subtotal,
    shippingFee,
    walletDeduction = 0,
    pointsDeduction = 0
  ) {
    const total = subtotal + shippingFee - walletDeduction - pointsDeduction;
    return Math.max(total, 0);
  }
  
  /**
   * Build checkout payload
   */
  export function buildCheckoutPayload({
    cartIds,
    addressId,
    paymentType,
    voucherCode = '',
    usePoints = false,
    useWallet = false,
    totalPoints = 0,
    walletDeduction = 0
  }) {
    return {
      vCode: voucherCode,
      pointNo: usePoints ? totalPoints : 0,
      patmentType: paymentType,
      addressId: addressId,
      specialPackageId: 0,
      walletValue: useWallet ? walletDeduction : 0,
      cardToken: '',
      cardNumber: 0,
      cardExpiryYear: 0,
      cardExpiryMonth: 0,
      cardCvv: 0,
      cartIds: cartIds.map(id => parseInt(id, 10))
    };
  }
  
  /**
   * Format address display string
   */
  export function formatAddress(address, t) {
    if (!address) return '';
    
    const parts = [
      address.cityName,
      address.areaName,
      address.streetName,
      address.buldingNo && `${t?.('checkout.building', 'Building')} ${address.buldingNo}`,
      address.floorNo && `${t?.('checkout.floor', 'Floor')} ${address.floorNo}`,
      address.flatNo && `${t?.('checkout.flat', 'Flat')} ${address.flatNo}`
    ].filter(Boolean);
    
    return parts.join(', ');
  }
  
  /**
   * Validate checkout form
   */
  export function validateCheckoutForm({
    selectedAddressId,
    selectedPaymentType,
    addresses
  }) {
    const errors = [];
    
    if (!selectedAddressId) {
      errors.push({ field: 'address', message: 'Please select a delivery address' });
    }
    
    if (!selectedPaymentType) {
      errors.push({ field: 'payment', message: 'Please select a payment method' });
    }
    
    if (addresses.length === 0) {
      errors.push({ field: 'address', message: 'No addresses available. Please add an address first.' });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get checkout error message
   */
  export function getCheckoutErrorMessage(error, locale = 'ar') {
    const messages = {
      ar: {
        network: 'فشل الاتصال بالسيرفر. تحقق من اتصال الإنترنت',
        timeout: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
        unauthorized: 'غير مصرح. يرجى تسجيل الدخول',
        validation: 'بيانات غير صحيحة. يرجى التحقق من المعلومات',
        server: 'خطأ في السيرفر. يرجى المحاولة لاحقاً',
        default: 'حدث خطأ أثناء إتمام الطلب. يرجى المحاولة مرة أخرى'
      },
      en: {
        network: 'Network connection failed. Check your internet',
        timeout: 'Request timeout. Please try again',
        unauthorized: 'Unauthorized. Please login',
        validation: 'Invalid data. Please check your information',
        server: 'Server error. Please try later',
        default: 'An error occurred during checkout. Please try again'
      }
    };
    
    const localeMessages = messages[locale] || messages.en;
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return localeMessages.timeout;
    }
    
    if (error?.response?.status === 401) {
      return localeMessages.unauthorized;
    }
    
    if (error?.response?.status === 400) {
      return localeMessages.validation;
    }
    
    if (error?.response?.status >= 500) {
      return localeMessages.server;
    }
    
    return error?.message || localeMessages.default;
  }