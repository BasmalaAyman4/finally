'use client';

import { useEffect } from 'react';
import styles from './cart.module.css';

export default function CartError({ error, reset }) {
  useEffect(() => {
    console.error('Cart error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚠️</div>
          <h2>Something went wrong</h2>
          <p>We couldn't load your cart. Please try again.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              className={styles.continueShopping}
              onClick={() => reset()}
            >
              Try Again
            </button>
            <button
              className={styles.updateCart}
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}