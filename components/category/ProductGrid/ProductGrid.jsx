'use client';

import Card from '@/components/ui/Card/Card';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, locale }) {
 

  return (
    <div className={styles.grid}>
     {/*  {products?.map((product) => (
        <Card 
          key={product.productId} 
          product={product}
          locale={locale}
        />
      ))} */}
    </div>
  );
}