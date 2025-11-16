import Link from 'next/link';
import styles from './page.module.css';
import { serverApi } from '@/lib/server-fetch';
import SaleBanner from '@/components/common/SaleBanner/SaleBanner';
import BannerWithClient from '@/components/Home/Banner/BannerWithClient';
import ScrollingBanner from '@/components/common/ScrollingBanner/ScrollingBanner';
import CategoriesHome from '@/components/Home/Categories/Categories';
import BrandHome from '@/components/Home/Brands/Brands';
import ArrivedProducts from '@/components/Home/ArrivedProducts/ArrivedProducts';
import TrendingProducts from '@/components/Home/TrendingProducts/TrendingProducts';

export default async function HomePage({ params }) {
  const { locale } = await params;

  // Parallel fetching with individual error handling
  const [homeResult, searchBasicResult] = await Promise.allSettled([
    serverApi.get('/api/Home', {
      locale,
      revalidate: 300,
      tags: ['home'],
      timeout: 30000, // 30s for home API
    }),
    serverApi.get('/api/AdvancedSearch', {
      locale,
      revalidate: 600,
      tags: ['search-basic'],
      timeout: 25000, // 25s for search API
    }),
  ]);

  // Extract results
  const homeData = homeResult.status === 'fulfilled' && homeResult.value.success
    ? homeResult.value.data
    : null;

  const brands = searchBasicResult.status === 'fulfilled' && searchBasicResult.value.success
    ? searchBasicResult.value.data?.productSearchBasicData?.brands || []
    : [];

  // Log errors in development
  if (process.env.NODE_ENV === 'development') {
    if (homeResult.status === 'rejected' || !homeData) {
      console.error('Home API failed:', 
        homeResult.status === 'rejected' 
          ? homeResult.reason 
          : homeResult.value
      );
    }
    if (searchBasicResult.status === 'rejected') {
      console.error('Search API failed:', searchBasicResult.reason);
    }
  }

  // Complete failure - show error page
  if (!homeData) {
    const errorDetails = homeResult.status === 'fulfilled' 
      ? homeResult.value 
      : { error: 'Failed to load page data', errorCode: 'FETCH_FAILED' };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {locale === 'ar' ? 'خطأ في تحميل الصفحة' : 'Failed to load page'}
          </h1>
          <p className="text-gray-600 mb-2">
            {errorDetails.error || 'Unknown error occurred'}
          </p>
          {errorDetails.errorCode && (
            <p className="text-sm text-gray-500 mb-4">
              Error Code: {errorDetails.errorCode}
            </p>
          )}
          <Link
            href={`/${locale}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Link>
        </div>
      </div>
    );
  }
console.log(brands,homeData)
  // Partial success - show page with warnings
  return (
    <main>
<SaleBanner/>
<BannerWithClient banners={homeData.banners}/>
  <ScrollingBanner/>
  <CategoriesHome categories={homeData.categories} locale={locale}/>
  <BrandHome brands={brands}/>
  <ArrivedProducts arrivedProducts={homeData.recentlyArrived}/>
  <TrendingProducts productDiscounts={homeData.recentlyArrived} popularProducts={homeData.recentlyArrived}/>
    </main>
  );
}