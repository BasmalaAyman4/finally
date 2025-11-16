'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './FilterSidebar.module.css';

export default function FilterSidebar({
  subcategories,
  brands,
  selectedSubCategory,
  selectedBrand,
  locale,
  categorySlug,
}) {
  const router = useRouter();

  const handleFilterChange = (type, value) => {
    const params = new URLSearchParams();
    
    if (type === 'subCategory') {
      if (value) params.set('subCategory', value);
      if (selectedBrand) params.set('brand', selectedBrand);
    } else if (type === 'brand') {
      if (selectedSubCategory) params.set('subCategory', selectedSubCategory);
      if (value) params.set('brand', value);
    }
    
    const queryString = params.toString();
    const url = `/${locale}/category/${categorySlug}${queryString ? `?${queryString}` : ''}`;
    
    router.push(url);
  };

  const clearFilters = () => {
    router.push(`/${locale}/category/${categorySlug}`);
  };

  const hasActiveFilters = selectedSubCategory || selectedBrand;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filters</h2>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className={styles.clearBtn}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Category</h3>
          <div className={styles.filterList}>
            {subcategories.map((sub,index) => (
              <button
                key={index}
                onClick={() => handleFilterChange('subCategory', 
                  selectedSubCategory === String(sub.id) ? null : String(sub.id)
                )}
                className={`${styles.filterItem} ${
                  selectedSubCategory === String(sub.id) ? styles.active : ''
                }`}
              >
                <div className={styles.filterImage}>
                  <Image
                    src={sub.imageUrl}
                    alt={sub.name}
                    width={40}
                    height={40}
                    className={styles.image}
                  />
                </div>
                <span className={styles.filterName}>{sub.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Brand</h3>
          <div className={styles.filterList}>
            {brands.map((brand) => (
              <button
                key={brand.brandId}
                onClick={() => handleFilterChange('brand',
                  selectedBrand === String(brand.brandId) ? null : String(brand.brandId)
                )}
                className={`${styles.filterItem} ${
                  selectedBrand === String(brand.brandId) ? styles.active : ''
                }`}
              >
                <div className={styles.filterImage}>
                  <Image
                    src={brand.imageUrl}
                    alt={brand.brandName}
                    width={40}
                    height={40}
                    className={styles.image}
                  />
                </div>
                <span className={styles.filterName}>{brand.brandName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}