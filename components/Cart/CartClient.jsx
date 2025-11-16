'use client';

import { useState, useTransition, useOptimistic, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  incrementCartItem,
  decrementCartItem,
  deleteCartItem,
  batchUpdateCart,
} from './actions';
import { Trash, Truck, SquareCheckBig } from 'lucide-react';
import styles from './cart.module.css';
import { useLocale } from '@/contexts/LocaleContext';
import { calculateShipping } from '@/lib/shipping-offers';

export default function CartClient({ initialData, locale, shippingOffer }) {
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  
  // Selected items - initialize once
  const [selectedItems, setSelectedItems] = useState(() => 
    initialData.cartProduccts.map(item => item.id)
  );
  
  const [optimisticCart, setOptimisticCart] = useOptimistic(
    initialData,
    (state, { type, id, value }) => {
      switch (type) {
        case 'increment':
          return {
            ...state,
            cartProduccts: state.cartProduccts.map((item) =>
              item.id === id ? { ...item, qty: item.qty + 1 } : item
            ),
          };
        case 'decrement':
          return {
            ...state,
            cartProduccts: state.cartProduccts.map((item) =>
              item.id === id && item.qty > 1
                ? { ...item, qty: item.qty - 1 }
                : item
            ),
          };
        case 'delete':
          return {
            ...state,
            cartProduccts: state.cartProduccts.filter((item) => item.id !== id),
          };
        case 'batch-delete':
          return {
            ...state,
            cartProduccts: state.cartProduccts.filter((item) => !value.includes(item.id)),
          };
        default:
          return state;
      }
    }
  );

  // Memoized calculations
  const calculations = useMemo(() => {
    const selectedProducts = optimisticCart.cartProduccts.filter(item => 
      selectedItems.includes(item.id)
    );

    const subtotal = selectedProducts.reduce((sum, item) => {
      const price = item.saleaPrice || item.discountPrice || 0;
      return sum + (price * item.qty);
    }, 0);

    const shipping = calculateShipping(subtotal, shippingOffer, 0);
    const total = subtotal  + shipping.deliveryFee;

    return {
      subtotal,
      total,
      ...shipping,
      calculateItemTotal: (item) => (item.saleaPrice || item.discountPrice || 0) * item.qty,
    };
  }, [optimisticCart.cartProduccts, selectedItems, shippingOffer]);

  // Selection handlers
  const toggleItemSelection = useCallback((id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedItems(prev => 
      prev.length === optimisticCart.cartProduccts.length 
        ? [] 
        : optimisticCart.cartProduccts.map(item => item.id)
    );
  }, [optimisticCart.cartProduccts]);

  // Unified action handler
  const handleCartAction = useCallback(async (
    id, 
    action, 
    actionFn, 
    optimisticUpdate
  ) => {
    setError(null);
    setActionLoading(prev => ({ ...prev, [id]: action }));

    startTransition(async () => {
      if (optimisticUpdate) {
        setOptimisticCart(optimisticUpdate);
      }

      const result = await actionFn();

      if (!result.success) {
        setError(result.error || `Failed to ${action}`);
        router.refresh();
      } else if (action === 'delete') {
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      }

      setActionLoading(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });

      router.refresh();
    });
  }, [router, setOptimisticCart]);

  // Action handlers
  const handleIncrement = useCallback((id) => {
    handleCartAction(
      id,
      'increment',
      () => incrementCartItem(id, locale),
      { type: 'increment', id }
    );
  }, [handleCartAction, locale]);

  const handleDecrement = useCallback((id, currentQty) => {
    if (currentQty <= 1) return;
    handleCartAction(
      id,
      'decrement',
      () => decrementCartItem(id, locale),
      { type: 'decrement', id }
    );
  }, [handleCartAction, locale]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm(t('cart.confirmDelete', 'Remove this item?'))) return;

    handleCartAction(
      id,
      'delete',
      () => deleteCartItem(id, locale),
      { type: 'delete', id }
    );
  }, [handleCartAction, locale, t]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;

    if (!confirm(t('cart.confirmDeleteSelected', `Remove ${selectedItems.length} items?`))) {
      return;
    }

    setError(null);
    const loadingStates = selectedItems.reduce((acc, id) => ({ ...acc, [id]: 'delete' }), {});
    setActionLoading(loadingStates);

    startTransition(async () => {
      setOptimisticCart({ type: 'batch-delete', value: selectedItems });

      const operations = selectedItems.map(id => ({ id, action: 'delete' }));
      const result = await batchUpdateCart(operations, locale);

      if (!result.success || result.failedCount > 0) {
        setError(`${result.failedCount || selectedItems.length} items failed to delete`);
        router.refresh();
      }

      setSelectedItems([]);
      setActionLoading({});
      router.refresh();
    });
  }, [selectedItems, locale, router, setOptimisticCart, t]);

  const handleCheckout = useCallback(() => {
    if (selectedItems.length === 0) {
      setError(t('cart.selectItems', 'Select at least one item'));
      return;
    }

    const queryParams = selectedItems.map(id => `CartIds=${id}`).join('&');
    router.push(`/${locale}/checkout?${queryParams}`);
  }, [selectedItems, locale, router, t]);

  // Empty cart
  if (optimisticCart.cartProduccts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{t("cart.empty")}</p>
        <button
          className={styles.continueShopping}
          onClick={() => router.push(`/${locale}`)}
        >
          {t("cart.continueShopping")}
        </button>
      </div>
    );
  }

  const { 
    subtotal, 
    discount, 
    deliveryFee,
    shippingDiscount,
    total,
    qualifiesForDiscount,
    amountUntilFreeShipping,
    progressPercentage,
    discountText,
    calculateItemTotal 
  } = calculations;

  return (
    <div className={styles.cartContainer}>
      {error && (
        <div className={styles.errorBanner}>
          {error}
          <button onClick={() => setError(null)} aria-label="Close">×</button>
        </div>
      )}

      {/* Shipping Progress */}
      {selectedItems.length > 0 && (
        <div className={styles.freeShippingBanner}>
          {!qualifiesForDiscount ? (
            <p className={styles.shippingMessage}>
              {t('cart.shopMore', 'Shop for')} <strong>EGP {amountUntilFreeShipping.toFixed(2)}</strong> {t('cart.moreFreeShipping', `more for ${discountText} shipping off`)}
            </p>
          ) : (
            <p className={styles.shippingMessageSuccess}>
              🎉 {t('cart.freeShippingQualified', `You've qualified for ${discountText} off!`)}
            </p>
          )}
          <div className={styles.progressBarWrapper}>
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${progressPercentage}%` }}
              />
              <Truck 
                className={styles.truckIcon} 
                size={32} 
                style={{ 
                  [locale === 'ar' ? 'right' : 'left']: `calc(${progressPercentage}% - 22px)`
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.cartItems}>
        {/* Bulk Actions */}
        <div className={styles.bulkActions}>
          <button onClick={toggleSelectAll} className={styles.selectAllBtn}>
            <SquareCheckBig
              size={24}
              className={
                selectedItems.length === optimisticCart.cartProduccts.length
                  ? styles.checkboxChecked
                  : styles.checkboxUnchecked
              }
            />
          </button>
          <span className={styles.selectedCount}>
            {selectedItems.length} {t('cart.itemsSelected', 'selected')}
          </span>
         
        </div>
        
        {/* Cart Items */}
        {optimisticCart.cartProduccts.map((item) => {
          const isLoading = actionLoading[item.id];
          const isSelected = selectedItems.includes(item.id);

          return (
            <div
              key={item.id}
              className={`${styles.cartItem} ${isLoading ? styles.loading : ''} ${isSelected ? styles.selected : ''}`}
            >
              <button
                onClick={() => toggleItemSelection(item.id)}
                className={styles.selectionCheckbox}
                disabled={isLoading}
              >
                <SquareCheckBig
                  size={24}
                  className={isSelected ? styles.checkboxChecked : styles.checkboxUnchecked}
                />
              </button>

              <div className={styles.itemImage}>
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  width={50}
                  height={80}
                  loading="lazy"
                />
              </div>

              <div className={styles.itemDetails}>
                <h3 className={styles.itemName}>{item.productName}</h3>
                <p className={styles.itemVariant}>
                  {item.colorName && `${t("cart.color")}: ${item.colorName}`}
                  {item.sizeName && ` • ${t("cart.size")}: ${item.sizeName}`}
                </p>
              </div>

              <div className={styles.quantityControl}>
                <button
                  onClick={() => handleDecrement(item.id, item.qty)}
                  disabled={item.qty <= 1 || isLoading}
                  className={styles.qtyBtn}
                >
                  −
                </button>
                <span className={styles.quantity}>{item.qty}</span>
                <button
                  onClick={() => handleIncrement(item.id)}
                  disabled={isLoading}
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>

              <div className={styles.itemPrice}>
                <span>EGP {calculateItemTotal(item).toFixed(2)}</span>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                disabled={isLoading}
                className={styles.deleteBtn}
              >
                <Trash color="red" />
              </button>

              {isLoading && (
                <div className={styles.itemLoadingOverlay}>
                  <div className={styles.spinner} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className={styles.orderSummary}>
        <h2 className={styles.summaryTitle}>{t("cart.OrderSummary")}</h2>

        <div className={styles.summaryRow}>
          <span>{t("cart.subtotal")}</span>
          <span>EGP {subtotal.toFixed(2)}</span>
        </div>

  

        

    

        <div className={styles.summaryTotal}>
          <span>{t("cart.total")}</span>
          <span>EGP {total.toFixed(2)}</span>
        </div>

        <button
          className={styles.checkoutBtn}
          disabled={isPending || selectedItems.length === 0}
          onClick={handleCheckout}
        >
          {selectedItems.length === 0 
            ? t("cart.selectItemsFirst") 
            : `${t("cart.checkout")} (${selectedItems.length})`
          }
        </button>
      </div>
    </div>
  );
}