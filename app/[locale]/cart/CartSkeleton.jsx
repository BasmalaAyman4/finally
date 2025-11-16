import styles from './cart.module.css';

export default function CartSkeleton() {
  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartItems}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${styles.cartItem} ${styles.skeleton}`}>
            <div className={styles.skeletonImage}></div>
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonTitle}></div>
              <div className={styles.skeletonText}></div>
            </div>
            <div className={styles.skeletonQty}></div>
            <div className={styles.skeletonPrice}></div>
          </div>
        ))}
      </div>

      <div className={`${styles.orderSummary} ${styles.skeleton}`}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonText}></div>
        <div className={styles.skeletonText}></div>
      </div>
    </div>
  );
}