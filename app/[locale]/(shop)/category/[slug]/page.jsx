// app/[locale]/(shop)/category/[slug]/page.jsx
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/server-fetch';
import styles from './category.module.css';
import CategoryHeader from '@/components/category/CategoryHeader/CategoryHeader';
import FilterSidebar from '@/components/category/FilterSidebar/FilterSidebar';
import ProductGrid from '@/components/category/ProductGrid/ProductGrid';
import Pagination from '@/components/category/Pagination/Pagination';

// Generate metadata for SEO
export async function generateMetadata({ params, searchParams }) {
  const { locale, slug } = params;
  
  // Fetch category data
  const categoryData = await getCategoryBySlug(slug, locale);
  
  if (!categoryData) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${categoryData.name} | La Jolie`,
    description: `Shop ${categoryData.name} products at La Jolie. Premium quality beauty and skincare products.`,
    openGraph: {
      title: `${categoryData.name} | La Jolie`,
      description: `Shop ${categoryData.name} products at La Jolie`,
      images: [categoryData.imageUrl],
    },
  };
}

// Helper function to get category by slug
async function getCategoryBySlug(slug, locale) {
  const result = await serverApi.get('api/CategoryDetails/category', {
    locale,
    revalidate: 3600, // Cache for 1 hour
    tags: ['categories'],
  });

  if (!result.success) return null;

  // Convert slug back to category name (e.g., "skin-care" -> "Skin care")
  const categoryName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return result.data?.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
}

// Helper function to get subcategories and brands
async function getCategoryDetails(categoryId, locale) {
  const result = await serverApi.get(`api/CategoryDetails/${categoryId}`, {
    locale,
    revalidate: 1800, // Cache for 30 minutes
    tags: [`category-${categoryId}`],
  });

  return result.success ? result.data : [];
}

// Helper function to get products
async function getProducts(categoryId, filters, locale) {
  const { subCategoryId, brandId, pageNo = 1, pageSize = 20 } = filters;
  
  let endpoint = `api/CategoryDetails?categoryId=${categoryId}&pageNo=${pageNo}&pageSize=${pageSize}`;
  
  if (subCategoryId) {
    endpoint += `&subCategoryId=${subCategoryId}`;
  }
  
  if (brandId) {
    endpoint += `&brandId=${brandId}`;
  }

  const result = await serverApi.get(endpoint, {
    locale,
    revalidate: 300, // Cache for 5 minutes
    tags: [`products-${categoryId}`],
  });

  return result.success ? result.data : [];
}

export default async function CategoryPage({ params, searchParams }) {
  const { locale, slug } = params;
  const { 
    subCategory, 
    brand, 
    page = '1' 
  } = searchParams;

  // Get category by slug
  const category = await getCategoryBySlug(slug, locale);
  
  if (!category) {
    notFound();
  }

  // Get subcategories and brands
  const categoryDetails = await getCategoryDetails(category.id, locale);

  // Get products with filters
  const products = await getProducts(
    category.id,
    {
      subCategoryId: subCategory,
      brandId: brand,
      pageNo: parseInt(page),
      pageSize: 20,
    },
    locale
  );

  // Parse subcategories and brands for easier use
  const subcategories = categoryDetails.map(item => ({
    id: item.subCategoryId,
    name: item.subCategoryName,
    imageUrl: item.imageUrl,
  }));

  // Get unique brands across all subcategories
  const allBrands = new Map();
  categoryDetails.forEach(item => {
    item.brands?.forEach(brand => {
      if (!allBrands.has(brand.brandId)) {
        allBrands.set(brand.brandId, brand);
      }
    });
  });
  const brands = Array.from(allBrands.values());

  return (
    <div className={styles.container}>
      <CategoryHeader 
        category={category}
        productsCount={products.length}
      />

      <div className={styles.content}>
        <FilterSidebar
          subcategories={subcategories}
          brands={brands}
          selectedSubCategory={subCategory}
          selectedBrand={brand}
          locale={locale}
          categorySlug={slug}
        />

        <main className={styles.main}>
          {products.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No products found</p>
            </div>
          ) : (
            <>
              <ProductGrid products={products} locale={locale} />
              
              {products.length === 20 && (
                <Pagination 
                  currentPage={parseInt(page)}
                  categorySlug={slug}
                  filters={{ subCategory, brand }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}