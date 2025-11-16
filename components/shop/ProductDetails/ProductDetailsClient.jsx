"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useProductSelection } from "@/hooks/useProductSelection";
import { ImageGallery } from "./ImageGallery";
import { ProductInfo } from "./ProductInfo";
import { ProductActions } from "./ProductActions";
import styles from "./ProductDetails.module.css";
import { getCachedPriceFormatter } from "@/utils/priceFormatters";
import { useUser } from "@/hooks/useUser";

const ProductDetailsClient = memo(({ product, locale }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { token } = useUser();

  const {
    selectedColorIndex,
    selectedSizeIndex,
    selectedImageIndex,
    selectedColor,
    selectedSize,
    availableSizes,
    currentImages,
    displayPrice,
    originalPrice,
    inStock,
    handleColorChange,
    handleSizeChange,
    handleImageChange,
  } = useProductSelection(product);

  // Memoized price formatter
  const priceFormatter = useMemo(() => {
    try {
      return getCachedPriceFormatter(locale);
    } catch (error) {
      console.error("Failed to create price formatter:", error);
      return new Intl.NumberFormat(locale === "en" ? "en-US" : "ar-EG", {
        style: "currency",
        currency: "EGP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
  }, [locale]);

  const formatPrice = useCallback(
    (price) => {
      if (typeof price !== "number" || price <= 0) return "0 EGP";
      try {
        return priceFormatter.format(price);
      } catch (error) {
        console.error("Price formatting error:", error);
        return `${price} EGP`;
      }
    },
    [priceFormatter]
  );

  // Event handlers
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite((prev) => !prev);
    // TODO: Implement favorite API call here
  }, []);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} from ${
            product.productBrand?.brand || "our store"
          }`,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        console.log("Link copied to clipboard");
      }
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    }
  }, [product.name, product.productBrand?.brand]);

  const handleImageClick = useCallback(() => {
    setIsImageModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  // Early return for invalid data
  if (!selectedColor) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Product data is incomplete</p>
      </div>
    );
  }

  // Determine visibility based on flags
  const shouldShowColors = !product.isDisappearColor;
  const shouldShowSizes = !product.isDisappearSize;

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <span>{product.category || "Products"}</span>
        <span className={styles.separator}>/</span>
        <span>{product.productTypeName || "Items"}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.currentPage}>{product.name}</span>
      </nav>

      <div className={styles.productContainer}>
        <div>
          <ImageGallery
            images={currentImages}
            selectedImageIndex={selectedImageIndex}
            onImageChange={handleImageChange}
            onImageClick={handleImageClick}
          />
          <ProductActions
            inStock={inStock}
            isFavorite={isFavorite}
            product={product}
            onToggleFavorite={handleToggleFavorite}
            maxQuantity={selectedSize?.qty || 0}
            selectedColorId={selectedColor?.colorId}
            selectedSizeId={selectedSize?.sizeId}
            selectedSize={selectedColor}
            locale={locale}
          />
        </div>

        <ProductInfo
          product={product}
          selectedColor={selectedColor}
          selectedColorIndex={selectedColorIndex}
          availableSizes={availableSizes}
          selectedSizeIndex={selectedSizeIndex}
          displayPrice={displayPrice}
          originalPrice={originalPrice}
          formatPrice={formatPrice}
          onColorChange={handleColorChange}
          onSizeChange={handleSizeChange}
          onShare={handleShare}
          locale={locale}
          shouldShowColors={shouldShowColors}
          shouldShowSizes={shouldShowSizes}
        />
      </div>
    </div>
  );
});

ProductDetailsClient.displayName = "ProductDetailsClient";

export default ProductDetailsClient;
