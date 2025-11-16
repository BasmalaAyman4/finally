
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAvailableSizes, getBestPrice, isInStock } from '@/utils/productdetails';

/**
 * Optimized hook for managing product selection state
 * Includes proper memoization and performance optimizations
 */
export const useProductSelection = (product) => {
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Memoize selected color to prevent unnecessary recalculations
    const selectedColor = useMemo(() => {
        if (!product?.colors?.length) return null;
        const color = product.colors[selectedColorIndex];
        return color || product.colors[0];
    }, [product?.colors, selectedColorIndex]);

    // Memoize available sizes based on selected color
    const availableSizes = useMemo(() => {
        if (!selectedColor) return [];
        return getAvailableSizes(selectedColor);
    }, [selectedColor]);

    // Memoize selected size
    const selectedSize = useMemo(() => {
        if (!availableSizes.length) return null;
        const size = availableSizes[selectedSizeIndex];
        return size || availableSizes[0];
    }, [availableSizes, selectedSizeIndex]);

    // Memoize current images array
    const currentImages = useMemo(() => {
        if (!selectedColor?.productImages) return [];
        return selectedColor.productImages;
    }, [selectedColor?.productImages]);

    // Memoize current image
    const currentImage = useMemo(() => {
        if (!currentImages.length) return null;
        const image = currentImages[selectedImageIndex];
        return image || currentImages[0];
    }, [currentImages, selectedImageIndex]);

    // Memoize display price calculation
    const displayPrice = useMemo(() => {
        return getBestPrice(selectedSize, selectedColor);
    }, [selectedSize, selectedColor]);

    // Memoize original price (for discount display)
    const originalPrice = useMemo(() => {
        // Check if there's a discount at size level
        if (selectedSize?.discountPrice > 0 && selectedSize?.salesPrice > 0) {
            return selectedSize.salesPrice;
        }
        
        // Check if there's a discount at color level
        if (selectedColor?.discountPrice > 0 && selectedColor?.salesPrice > 0) {
            return selectedColor.salesPrice;
        }
        
        return null;
    }, [selectedSize, selectedColor]);

    // Memoize stock status
    const inStock = useMemo(() => {
        return isInStock(selectedSize, selectedColor);
    }, [selectedSize, selectedColor]);

    // Reset size selection when color changes
    useEffect(() => {
        if (availableSizes.length > 0) {
            // Find first in-stock size or default to first size
            const firstInStockIndex = availableSizes.findIndex(
                size => size.qty > 0
            );
            setSelectedSizeIndex(firstInStockIndex >= 0 ? firstInStockIndex : 0);
        }
    }, [availableSizes]);

    // Reset image when color changes
    useEffect(() => {
        setSelectedImageIndex(0);
    }, [selectedColorIndex]);

    // Handlers with useCallback for optimization
    const handleColorChange = useCallback((colorIndex) => {
        if (colorIndex >= 0 && colorIndex < product?.colors?.length) {
            setSelectedColorIndex(colorIndex);
        }
    }, [product?.colors?.length]);

    const handleSizeChange = useCallback((sizeIndex) => {
        if (sizeIndex >= 0 && sizeIndex < availableSizes.length) {
            setSelectedSizeIndex(sizeIndex);
        }
    }, [availableSizes.length]);

    const handleImageChange = useCallback((imageIndex) => {
        if (imageIndex >= 0 && imageIndex < currentImages.length) {
            setSelectedImageIndex(imageIndex);
        }
    }, [currentImages.length]);

    return {
        // State values
        selectedColorIndex,
        selectedSizeIndex,
        selectedImageIndex,

        // Computed values
        selectedColor,
        selectedSize,
        availableSizes,
        currentImages,
        currentImage,
        displayPrice,
        originalPrice,
        inStock,

        // Handlers
        handleColorChange,
        handleSizeChange,
        handleImageChange,
    };
};