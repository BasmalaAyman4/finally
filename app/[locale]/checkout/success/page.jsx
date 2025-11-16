// app/[locale]/checkout/success/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import styles from './success.module.css';

export default function CheckoutSuccessPage({ params }) {
  const { locale } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // Clear cart cache or trigger revalidation
    // This is where you'd typically clear the cart state
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.checkmarkWrapper}>
          <div className={styles.checkmark}>
            <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
              <circle cx="26" cy="26" r="25" fill="none" className={styles.checkmarkCircle} />
              <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className={styles.checkmarkCheck} />
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>
          {t('checkout.success.title', 'Order Placed Successfully!')}
        </h1>

        <p className={styles.message}>
          {t('checkout.success.message', 'Thank you for your order. We have received your order and will process it soon.')}
        </p>

        {orderId && (
          <div className={styles.orderInfo}>
            <span className={styles.orderLabel}>
              {t('checkout.success.orderId', 'Order ID')}:
            </span>
            <span className={styles.orderId}>{orderId}</span>
          </div>
        )}

        <div className={styles.actions}>
          <button
            onClick={() => router.push(`/${locale}/orders`)}
            className={styles.primaryButton}
          >
            {t('checkout.success.viewOrders', 'View My Orders')}
          </button>
          <button
            onClick={() => router.push(`/${locale}`)}
            className={styles.secondaryButton}
          >
            {t('checkout.success.continueShopping', 'Continue Shopping')}
          </button>
        </div>

        <div className={styles.infoBox}>
          <p className={styles.infoTitle}>
            {t('checkout.success.whatNext', "What's Next?")}
          </p>
          <ul className={styles.infoList}>
            <li>{t('checkout.success.step1', 'You will receive an email confirmation shortly')}</li>
            <li>{t('checkout.success.step2', 'We will prepare your order for shipping')}</li>
            <li>{t('checkout.success.step3', 'Track your order status in "My Orders"')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}