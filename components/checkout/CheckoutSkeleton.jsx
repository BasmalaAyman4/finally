// components/checkout/CheckoutSkeleton.jsx
import styles from './checkout-skeleton.module.css';

export default function CheckoutSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.checkoutGrid}>
        {/* Left Column Skeleton */}
        <div className={styles.leftColumn}>
          {/* Items Skeleton */}
          <div className={styles.section}>
            <div className={styles.skeletonTitle} />
            <div className={styles.itemsList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.skeletonItem}>
                  <div className={styles.skeletonText} style={{ width: '60%' }} />
                  <div className={styles.skeletonText} style={{ width: '20%' }} />
                  <div className={styles.skeletonText} style={{ width: '20%' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Skeleton */}
          <div className={styles.section}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonText} style={{ width: '80%', height: '60px' }} />
          </div>

          {/* Address Skeleton */}
          <div className={styles.section}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonText} style={{ width: '100%', height: '100px' }} />
          </div>

          {/* Payment Skeleton */}
          <div className={styles.section}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonText} style={{ width: '100%', height: '80px' }} />
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className={styles.rightColumn}>
          <div className={styles.summaryCard}>
            <div className={styles.skeletonTitle} />
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.summaryRow}>
                <div className={styles.skeletonText} style={{ width: '40%' }} />
                <div className={styles.skeletonText} style={{ width: '30%' }} />
              </div>
            ))}
            <div className={styles.skeletonButton} />
          </div>
        </div>
      </div>
    </div>
  );
}