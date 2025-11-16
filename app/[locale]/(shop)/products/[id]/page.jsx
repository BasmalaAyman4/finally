// app/[locale]/(shop)/products/[id]/page.jsx

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProductDetailsClient from '@/components/shop/ProductDetails/ProductDetailsClient';
import ProductSkeleton from '@/components/ui/ProductSkeleton/ProductSkeleton';
import ErrorBoundary from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { generateProductSEO, validateProductData } from '@/utils/productdetails';
import { serverApi } from '@/lib/server-fetch';

// Force static generation for better performance
export const dynamicParams = true;
export const revalidate = 600; // Revalidate every 10 minutes

export default async function ProductPage({ params }) {
    const { id, locale } = await params;

    return (
        <ErrorBoundary>
            <Suspense fallback={<ProductSkeleton />}>
                <ProductContent id={id} locale={locale} />
            </Suspense>
        </ErrorBoundary>
    );
}

// ✅ FIXED: Added proper error handling here
async function ProductContent({ id, locale }) {
    // Validate ID first
    if (!id || isNaN(Number(id))) {
        notFound();
    }

    try {
        const response = await serverApi.get(
            `/api/ProductDetails?id=${id}`, 
            {
                locale,
                revalidate: 300,
                tags: ['productdetails'],
                timeout: 30000,
            }
        );

        // Check if response is successful
        if (!response.success || !response.data) {
            console.error('Product API returned error:', response.error || 'No data');
            notFound();
        }

        // Validate product data structure
        const validation = validateProductData(response.data);
        if (!validation.isValid) {
            console.error('Invalid product data:', validation.errors);
            notFound();
        }

        // Return the component with valid data
        return <ProductDetailsClient product={response.data} locale={locale} />;

    } catch (error) {
        console.error('Failed to fetch product:', error);
        notFound();
    }
}

// ✅ FIXED: Enhanced metadata generation with error handling
export async function generateMetadata({ params }) {
    const { id, locale } = await params;

    try {
        // Validate ID
        if (!id || isNaN(Number(id))) {
            return {
                title: 'Invalid Product | Lajolie',
                description: 'The requested product ID is invalid.',
                robots: 'noindex, nofollow'
            };
        }

        const response = await serverApi.get(
            `/api/ProductDetails?id=${id}`, 
            {
                locale,
                revalidate: 300,
                tags: ['productdetails'],
                timeout: 30000,
            }
        );

        // Check response
        if (!response.success || !response.data) {
            return {
                title: 'Product Not Available | Lajolie',
                description: 'The requested product is not available at the moment.',
                robots: 'noindex, nofollow'
            };
        }

        // Validate product data
        const validation = validateProductData(response.data);
        if (!validation.isValid) {
            return {
                title: 'Product Not Available | Lajolie',
                description: 'The requested product is not available at the moment.',
                robots: 'noindex, nofollow'
            };
        }

        // Generate SEO metadata
        return generateProductSEO(response.data, locale);

    } catch (error) {
        console.error('Failed to generate metadata:', error);

        return {
            title: 'Product Not Found | Lajolie',
            description: 'The requested product could not be found.',
            robots: 'noindex, nofollow'
        };
    }
}