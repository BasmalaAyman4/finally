// components/category/CategoryHeader.jsx
import Image from 'next/image';
import styles from './CategoryHeader.module.css';

export default function CategoryHeader({ category, productsCount }) {
  return (
    <div className={styles.header}>
      <div className={styles.imageWrapper}>
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className={styles.image}
          priority
        />
      </div>
      
      <div className={styles.content}>
        <h1 className={styles.title}>{category.name}</h1>
        <p className={styles.count}>
          {productsCount} {productsCount === 1 ? 'Product' : 'Products'}
        </p>
      </div>
    </div>
  );
}