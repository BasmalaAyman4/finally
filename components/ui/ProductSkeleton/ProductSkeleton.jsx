
'use client';

import styles from './ProductSkeleton.module.css';

const ProductSkeleton = () => {
    return (
        <div className={styles.container}>
            <div className={styles.productContainer}>
                {/* Image Section Skeleton */}
                <div className={styles.imageSection}>
                    <div className={styles.mainImageSkeleton} />
                    <div className={styles.thumbnailContainer}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className={styles.thumbnailSkeleton} />
                        ))}
                    </div>
                </div>

                {/* Info Section Skeleton */}
                <div className={styles.infoSection}>
                    <div className={styles.brandSkeleton} />
                    <div className={styles.titleSkeleton} />
                    <div className={styles.ratingSkeleton} />
                    <div className={styles.priceSkeleton} />

                    {/* Color options skeleton */}
                    <div className={styles.optionGroup}>
                        <div className={styles.labelSkeleton} />
                        <div className={styles.colorOptions}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className={styles.colorSkeleton} />
                            ))}
                        </div>
                    </div>

                    {/* Size options skeleton */}
                    <div className={styles.optionGroup}>
                        <div className={styles.labelSkeleton} />
                        <div className={styles.sizeOptions}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={styles.sizeSkeleton} />
                            ))}
                        </div>
                    </div>

                    {/* Action buttons skeleton */}
                    <div className={styles.actionSkeleton} />

                    {/* Description skeleton */}
                    <div className={styles.descriptionSkeleton}>
                        <div className={styles.descriptionTitleSkeleton} />
                        <div className={styles.descriptionTextSkeleton} />
                        <div className={styles.descriptionTextSkeleton} />
                        <div className={styles.descriptionTextSkeleton} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSkeleton;