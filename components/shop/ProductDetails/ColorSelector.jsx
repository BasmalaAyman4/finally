'use client';

import { memo } from 'react';
import styles from './ProductDetails.module.css';

/**
 * Optimized Color Selector Component
 */
export const ColorSelector = memo(({ 
    colors, 
    selectedIndex, 
    onColorChange, 
    locale = 'ar' 
}) => {
    if (!colors || colors.length === 0) return null;

    const selectedColor = colors[selectedIndex];

    return (
        <div className={styles.optionGroup}>
            <label className={styles.optionLabel}>
                {locale === 'ar' ? 'اللون' : 'Color'}
                <span className={styles.selectedOption}>
                    {selectedColor?.name || 'N/A'}
                </span>
            </label>
            <div className={styles.colorOptions} role="radiogroup" aria-label={locale === 'ar' ? 'اختر اللون' : 'Select color'}>
                {colors.map((color, index) => {
                    const isSelected = index === selectedIndex;
                    const isDisabled = !color.colorId || (color.sizes?.length === 0);
                    
                    return (
                        <button
                            key={color.colorId || index}
                            className={`${styles.colorSwatch} ${isSelected ? styles.colorSwatchActive : ''}`}
                            style={{ 
                                backgroundColor: color.colorHex || '#ccc',
                                opacity: isDisabled ? 0.5 : 1
                            }}
                            onClick={() => !isDisabled && onColorChange(index)}
                            disabled={isDisabled}
                            aria-label={`${locale === 'ar' ? 'اختر لون' : 'Select color'} ${color.name || index + 1}`}
                            aria-pressed={isSelected}
                            role="radio"
                            aria-checked={isSelected}
                            title={color.name}
                        />
                    );
                })}
            </div>
        </div>
    );
});

ColorSelector.displayName = 'ColorSelector';
