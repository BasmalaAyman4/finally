// utils/productdetails.js - Optimized version

// Cache for validation results
const validationCache = new WeakMap();

/**
 * Validate product data structure with caching
 */
export const validateProductData = (product) => {
    if (validationCache.has(product)) {
        return validationCache.get(product);
    }

    const errors = [];

    if (!product) {
        errors.push('Product data is null or undefined');
        const result = { isValid: false, errors };
        return result;
    }

    // Required fields validation
    if (!product.productId) errors.push('Missing productId');
    if (!product.name) errors.push('Missing product name');
    
    // Colors validation
    if (!product.colors || !Array.isArray(product.colors)) {
        errors.push('Missing or invalid colors array');
    } else if (product.colors.length === 0) {
        errors.push('Product has no color variants');
    } else {
        // Validate each color
        product.colors.forEach((color, index) => {
            if (!color.colorId) errors.push(`Color ${index}: Missing colorId`);
            if (!color.sizes || !Array.isArray(color.sizes)) {
                errors.push(`Color ${index}: Missing or invalid sizes array`);
            }
        });
    }

    const result = {
        isValid: errors.length === 0,
        errors
    };

    // Cache the result
    validationCache.set(product, result);
    return result;
};

/**
 * Generate SEO metadata for product
 */
export const generateProductSEO = (product, locale = 'ar') => {
    if (!product) return {};

    const brandName = product.productBrand?.brand || '';
    const title = `${product.name}${brandName ? ` | ${brandName}` : ''}`;
    
    // Clean and truncate description
    const description = product.description
        ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
        : `${product.name}${brandName ? ` from ${brandName}` : ''}`;

    // Get primary image
    const images = product.colors?.[0]?.productImages || [];
    const primaryImage = images.find(img => img.isPrimary) || images[0];

    // Get best price for structured data
    const firstSize = product.colors?.[0]?.sizes?.[0];
    const price = getBestPrice(firstSize, product.colors?.[0]);

    return {
        title,
        description,
        keywords: [
            product.name,
            brandName,
            product.category,
            product.productTypeName,
            ...(product.subCategories || []),
            ...(product.colors?.map(c => c.name) || [])
        ].filter(Boolean).join(', '),
        
        openGraph: {
            title,
            description,
            type: 'website',
            images: primaryImage ? [{
                url: primaryImage.fileLink,
                width: 800,
                height: 600,
                alt: product.name
            }] : [],
            siteName: 'Lajolie',
        },
        
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: primaryImage ? [primaryImage.fileLink] : [],
        },
        
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            brand: {
                '@type': 'Brand',
                name: brandName
            },
            category: product.category,
            description,
            image: primaryImage?.fileLink,
            offers: {
                '@type': 'Offer',
                price: price,
                priceCurrency: 'EGP',
                availability: isInStock(firstSize, product.colors?.[0])
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock'
            },
            aggregateRating: product.rate > 0 ? {
                '@type': 'AggregateRating',
                ratingValue: product.rate,
                reviewCount: product.productReviews?.length || 0
            } : undefined
        }
    };
};

/**
 * Get available sizes for a color (memoized)
 */
export const getAvailableSizes = (color) => {
    if (!color?.sizes || !Array.isArray(color.sizes)) return [];
    return color.sizes.filter(size => size && size.sizeId);
};

/**
 * Get best price with priority: size discount > size price > color discount > color price
 */
export const getBestPrice = (size, color) => {
    // Priority 1: Size-level discount
    if (size?.discountPrice > 0) return size.discountPrice;
    
    // Priority 2: Size-level sales price
    if (size?.salesPrice > 0) return size.salesPrice;
    
    // Priority 3: Color-level discount
    if (color?.discountPrice > 0) return color.discountPrice;
    
    // Priority 4: Color-level sales price
    if (color?.salesPrice > 0) return color.salesPrice;
    
    return 0;
};

/**
 * Check if product variant is in stock
 */
export const isInStock = (size, color) => {
    if (!size) return false;
    
    // Check if there's quantity available
    const hasQuantity = size.qty > 0;
    
    // Check if there's a valid price
    const hasPrice = getBestPrice(size, color) > 0;
    
    return hasQuantity && hasPrice;
};

/**
 * Get discount percentage
 */
export const getDiscountPercentage = (originalPrice, discountPrice) => {
    if (!originalPrice || !discountPrice || discountPrice >= originalPrice) {
        return 0;
    }
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};

/**
 * Format product features for display
 */
export const getProductFeatures = (product) => {
    const features = [];
    
    if (product.isVegan) {
        features.push({ key: 'vegan', label: { ar: 'نباتي', en: 'Vegan' } });
    }
    
    if (product.forChildren) {
        features.push({ key: 'children', label: { ar: 'للأطفال', en: 'For Children' } });
    }
    
    return features;
};

/**
 * Check if colors should be displayed
 */
export const shouldDisplayColors = (product) => {
    return !product.isDisappearColor && 
           product.colors?.length > 1;
};

/**
 * Check if sizes should be displayed
 */
export const shouldDisplaySizes = (product, availableSizes) => {
    return !product.isDisappearSize && 
           availableSizes?.length > 0;
};