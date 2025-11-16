'use client';

import { memo, useState, useCallback } from 'react';
import { Star, Share2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorSelector } from './ColorSelector';
import { SizeSelector } from './SizeSelector';
import styles from './ProductDetails.module.css';
import { sanitizeHTML } from '@/utils/validations';

// Reusable Collapsible Section Component
const CollapsibleSection = memo(({ 
    title, 
    content, 
    isOpen, 
    onToggle,
    alwaysOpen = false 
}) => {
    if (!content) return null;

    const sectionContent = (
        <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
        />
    );

    if (alwaysOpen) {
        return (
            <div className={styles.descriptionContainer}>
                <h3 className={styles.descriptionTitle}>{title}</h3>
                {sectionContent}
            </div>
        );
    }

    return (
        <div className={styles.collapsibleContainer}>
            <button
                className={styles.collapsibleHeader}
                onClick={onToggle}
                aria-expanded={isOpen}
                type="button"
            >
                <h3 className={styles.descriptionTitle}>{title}</h3>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                    <ChevronDown size={20} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className={styles.collapsibleContent}>
                            {sectionContent}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

CollapsibleSection.displayName = 'CollapsibleSection';

// Optimized Star Rating Component
const StarRating = memo(({ rating, reviewCount }) => (
    <div className={styles.ratingContainer}>
        <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${styles.star} ${star <= rating ? styles.starFilled : styles.starEmpty}`}
                    size={16}
                    aria-hidden="true"
                />
            ))}
        </div>
        <span className={styles.reviewCount}>({reviewCount || 0} reviews)</span>
    </div>
));

StarRating.displayName = 'StarRating';

export const ProductInfo = memo(({
    product,
    selectedColor,
    selectedColorIndex,
    availableSizes,
    selectedSizeIndex,
    displayPrice,
    originalPrice,
    formatPrice,
    onColorChange,
    onSizeChange,
    onShare,
    locale,
    shouldShowColors,
    shouldShowSizes
}) => {
    // State for collapsible sections
    const [openSections, setOpenSections] = useState({
        howToUse: false,
        ingredients: false
    });

    // Memoized toggle handler
    const toggleSection = useCallback((section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Memoized calculations
    const hasDiscount = originalPrice && originalPrice !== displayPrice;
    const discountPercentage = hasDiscount 
        ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
        : 0;

    // Localized text
    const text = {
        description: locale === 'ar' ? 'الوصف' : 'Description',
        howToUse: locale === 'ar' ? 'طريقة الاستخدام' : 'How To Use',
        ingredients: locale === 'ar' ? 'المكونات' : 'Ingredients',
        share: locale === 'ar' ? 'مشاركة المنتج' : 'Share product',
        vegan: locale === 'ar' ? 'نباتي' : 'Vegan',
        forChildren: locale === 'ar' ? 'للأطفال' : 'For Children'
    };

    return (
        <div className={styles.infoSection}>
            {/* Brand Header */}
            <div className={styles.brandHeader}>
                {product.productBrand?.brand && (
                    <div className={styles.brand}>
                        {product.productBrand.brandImage && (
                            <img 
                                src={product.productBrand.brandImage} 
                                alt={product.productBrand.brand}
                                className={styles.brandLogo}
                                width={24}
                                height={24}
                            />
                        )}
                        <span>{product.productBrand.brand}</span>
                    </div>
                )}
                <div className={styles.headerActions}>
                    <button
                        className={styles.shareButton}
                        onClick={onShare}
                        aria-label={text.share}
                    >
                        <Share2 size={16} />
                    </button>
                    <span className={styles.productId}>#{product.productId}</span>
                </div>
            </div>

            {/* Product Title */}
            <h1 className={styles.productTitle}>{product.name}</h1>

            {/* Rating */}
            {product.canReview && (
                <StarRating
                    rating={product.rate || 0}
                    reviewCount={product.productReviews?.length || 0}
                />
            )}

            {/* Price Section */}
            <div className={styles.priceSection}>
                <span className={styles.currentPrice}>
                    {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                    <>
                        <span className={styles.originalPrice}>
                            {formatPrice(originalPrice)}
                        </span>
                        <span className={styles.discountBadge}>
                            -{discountPercentage}%
                        </span>
                    </>
                )}
            </div>

            {/* Color Selection */}
            {shouldShowColors && (
                <ColorSelector
                    colors={product.colors}
                    selectedIndex={selectedColorIndex}
                    onColorChange={onColorChange}
                    locale={locale}
                />
            )}

            {/* Size Selection */}
            {shouldShowSizes && (
                <SizeSelector
                    sizes={availableSizes}
                    selectedIndex={selectedSizeIndex}
                    onSizeChange={onSizeChange}
                    locale={locale}
                />
            )}

            {/* Product Features */}
            {(product.isVegan || product.forChildren) && (
                <div className={styles.features}>
                    {product.isVegan && (
                        <span className={styles.feature}>{text.vegan}</span>
                    )}
                    {product.forChildren && (
                        <span className={styles.feature}>{text.forChildren}</span>
                    )}
                </div>
            )}

            {/* Collapsible Sections */}
            <CollapsibleSection
                title={text.description}
                content={product.description}
                isOpen={true}
                onToggle={() => {}}
                alwaysOpen={true}
            />

            <CollapsibleSection
                title={text.howToUse}
                content={product.howToUse}
                isOpen={openSections.howToUse}
                onToggle={() => toggleSection('howToUse')}
            />

            <CollapsibleSection
                title={text.ingredients}
                content={product.ingredients}
                isOpen={openSections.ingredients}
                onToggle={() => toggleSection('ingredients')}
            />
        </div>
    );
});

ProductInfo.displayName = 'ProductInfo';