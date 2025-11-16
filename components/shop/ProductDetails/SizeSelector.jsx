'use client';

import { memo } from 'react';
import styles from './ProductDetails.module.css';

/**
 * Optimized Size Selector Component
 */
export const SizeSelector = memo(({ 
    sizes, 
    selectedIndex, 
    onSizeChange, 
    locale = 'ar' 
}) => {
    if (!sizes || sizes.length === 0) return null;

    const selectedSize = sizes[selectedIndex];

    return (
        <div className={styles.optionGroup}>
            <label className={styles.optionLabel}>
                {locale === 'ar' ? 'المقاس' : 'Size'}
                {selectedSize && (
                    <span className={styles.selectedOption}>
                        {selectedSize.name}
                    </span>
                )}
            </label>
            <div className={styles.sizeOptions} role="radiogroup" aria-label={locale === 'ar' ? 'اختر المقاس' : 'Select size'}>
                {sizes.map((size, index) => {
                    const isSelected = index === selectedIndex;
                    const isOutOfStock = size.qty === 0;
                    const isDisabled = !size.sizeId || isOutOfStock;
                    
                    return (
                        <button
                            key={size.sizeId || index}
                            className={`${styles.sizeButton} ${isSelected ? styles.sizeButtonActive : ''}`}
                            onClick={() => !isDisabled && onSizeChange(index)}
                            disabled={isDisabled}
                            aria-label={`${locale === 'ar' ? 'اختر مقاس' : 'Select size'} ${size.name}`}
                            aria-pressed={isSelected}
                            role="radio"
                            aria-checked={isSelected}
                            title={isOutOfStock 
                                ? (locale === 'ar' ? 'غير متوفر' : 'Out of stock')
                                : size.name
                            }
                        >
                            {size.name || `Size ${index + 1}`}
                            {isOutOfStock && (
                                <span className={styles.outOfStockIndicator} aria-hidden="true">
                                    ✕
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

SizeSelector.displayName = 'SizeSelector';