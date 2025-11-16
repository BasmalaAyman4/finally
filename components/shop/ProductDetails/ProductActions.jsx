'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react";
import { useCart } from '@/hooks/useCart';
import Button from '@/components/ui/common/Button/Button';
import styles from './ProductDetails.module.css';
import { VirtualLipstickTryOn } from './VirtualTryOn';

const QuantitySelector = memo(({ 
    quantity, 
    maxQuantity, 
    onIncrement, 
    onDecrement,
    locale 
}) => (
    <div className={styles.quantitySelector}>
        <span className={styles.quantityLabel}>
            {locale === 'ar' ? 'الكمية:' : 'Quantity:'}
        </span>
        <div className={styles.quantityControls}>
            <button
                onClick={onDecrement}
                disabled={quantity <= 1}
                className={styles.quantityButton}
                aria-label={locale === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
            >
                <Minus size={16} />
            </button>
            
            <span className={styles.quantityValue}>{quantity}</span>
            
            <button
                onClick={onIncrement}
                disabled={quantity >= maxQuantity}
                className={styles.quantityButton}
                aria-label={locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
            >
                <Plus size={16} />
            </button>
        </div>
        <span className={styles.quantityAvailable}>
            ({maxQuantity} {locale === 'ar' ? 'متوفر' : 'available'})
        </span>
    </div>
));

QuantitySelector.displayName = 'QuantitySelector';

const StatusMessage = memo(({ type, message, details, locale }) => {
    const icons = {
        success: <CheckCircle2 size={18} />,
        error: <AlertCircle size={18} />
    };

    const styles_status = {
        success: styles.successMessage,
        error: styles.errorMessage
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`${styles.statusMessage} ${styles_status[type]}`}
        >
            {icons[type]}
            <div>
                <div className={styles.statusMessageText}>{message}</div>
                {details && (
                    <div className={styles.statusMessageDetails}>{details}</div>
                )}
            </div>
        </motion.div>
    );
});

StatusMessage.displayName = 'StatusMessage';

export const ProductActions = memo(
  ({
    inStock,
    isFavorite,
    product,
    onToggleFavorite,
    maxQuantity = 1,
    selectedColorId,
    selectedSizeId,
    selectedSize,
    locale = "ar",
  }) => {
        const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);

    const [quantity, setQuantity] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);

    const {
      addToCart,
      isLoading,
      error,
      clearError,
      isAuthenticated,
      redirectToLogin,
      errorDetails,
    } = useCart(locale);

    // Reset quantity when selection changes
    useEffect(() => {
      setQuantity(1);
      clearError();
      setShowSuccess(false);
    }, [selectedColorId, selectedSizeId, maxQuantity, clearError]);

    // Auto-hide success message
    useEffect(() => {
      if (showSuccess) {
        const timer = setTimeout(() => setShowSuccess(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [showSuccess]);

    const handleIncrement = useCallback(() => {
      if (quantity < maxQuantity) {
        setQuantity((prev) => prev + 1);
      }
    }, [quantity, maxQuantity]);

    const handleDecrement = useCallback(() => {
      if (quantity > 1) {
        setQuantity((prev) => prev - 1);
      }
    }, [quantity]);

    const handleAddToCart = useCallback(async () => {
      clearError();
      setShowSuccess(false);

      if (!isAuthenticated) {
        redirectToLogin();
        return;
      }

      if (!selectedSize?.detailId) {
        console.error("No detailId available");
        return;
      }

      const result = await addToCart(selectedSize.detailId, quantity);

      if (result.success) {
        setShowSuccess(true);
      }
    }, [
      isAuthenticated,
      selectedSize,
      quantity,
      addToCart,
      clearError,
      redirectToLogin,
    ]);

    // Determine button state
    const getButtonState = () => {
      if (!isAuthenticated) {
        return {
          text: locale === "ar" ? "يجب تسجيل الدخول" : "Login Required",
          disabled: false,
        };
      }
      if (!selectedSize?.detailId) {
        return {
          text: locale === "ar" ? "اختر المقاس" : "Select Size",
          disabled: true,
        };
      }
      if (!inStock) {
        return {
          text: locale === "ar" ? "غير متوفر" : "Out of Stock",
          disabled: true,
        };
      }
      return {
        text: locale === "ar" ? "أضف إلى السلة" : "Add to Cart",
        disabled: false,
      };
    };

    const buttonState = getButtonState();
console.log(selectedSize);
    return (
      <div className={styles.actionContainer}>
        {/* Quantity Selector */}
        {inStock && isAuthenticated && selectedSize?.detailId && (
          <QuantitySelector
            quantity={quantity}
            maxQuantity={maxQuantity}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            locale={locale}
          />
        )}

        {/* Action Buttons */}
        {/*    <div className={styles.actionButtons}>
          <Button
            variant="primary"
            fullWidth={true}
            disabled={buttonState.disabled || isLoading}
            loading={isLoading}
            icon={<ShoppingCart size={20} />}
            onClick={handleAddToCart}
            className={styles.btn}
          >
            {buttonState.text}
          </Button>

          <Button
            variant="outline"
            icon={
              <Heart size={25} fill={isFavorite ? "currentColor" : "none"} />
            }
            onClick={onToggleFavorite}
            className={isFavorite ? styles.favoriteActive : ""}
            aria-label={
              isFavorite
                ? locale === "ar"
                  ? "إزالة من المفضلة"
                  : "Remove from favorites"
                : locale === "ar"
                ? "أضف إلى المفضلة"
                : "Add to favorites"
            }
          />
        </div> */}
        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Button
            variant="primary"
            fullWidth={true}
            disabled={buttonState.disabled || isLoading}
            loading={isLoading}
            icon={<ShoppingCart size={20} />}
            onClick={handleAddToCart}
            className={styles.btn}
          >
            {buttonState.text}
          </Button>

          {/* Virtual Try-On Button - Only show for products with colorHex */}
          {selectedSize?.colorHex && (
            <Button
              variant="outline"
              icon={<Camera size={20} />}
              onClick={() => setShowVirtualTryOn(true)}
              aria-label={locale === "ar" ? "تجربة افتراضية" : "Virtual Try-On"}
              title={
                locale === "ar"
                  ? "تجربة اللون على شفاهك"
                  : "Try this color on your lips"
              }
            />
          )}

          <Button
            variant="outline"
            icon={
              <Heart size={25} fill={isFavorite ? "currentColor" : "none"} />
            }
            onClick={onToggleFavorite}
            className={isFavorite ? styles.favoriteActive : ""}
            aria-label={
              isFavorite
                ? locale === "ar"
                  ? "إزالة من المفضلة"
                  : "Remove from favorites"
                : locale === "ar"
                ? "أضف إلى المفضلة"
                : "Add to favorites"
            }
          />
        </div>
        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {showSuccess && (
            <StatusMessage
              type="success"
              message={
                locale === "ar" ? "تمت الإضافة إلى السلة!" : "Added to cart!"
              }
              locale={locale}
            />
          )}

          {error && !showSuccess && (
            <StatusMessage
              type="error"
              message={error}
              details={errorDetails?.detail}
              locale={locale}
            />
          )}
        </AnimatePresence>
        <p>jhgjhg</p>
        {/* Virtual Try-On Modal */}
        {selectedSize?.colorHex && (
          <VirtualLipstickTryOn
            colorHex={selectedSize.colorHex}
            opacity={0.65}
            isActive={showVirtualTryOn}
            onClose={() => setShowVirtualTryOn(false)}
          />
        )}
      </div>
    );
  }
);

ProductActions.displayName = 'ProductActions';