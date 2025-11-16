
'use client';

import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import styles from './NotFound.module.css';

const NotFound = ({
    title = "Product Not Found",
    message = "Sorry, we couldn't find the product you're looking for.",
    showBackButton = true
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Package className={styles.icon} size={64} />
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.message}>{message}</p>

                {showBackButton && (
                    <div className={styles.actions}>
                        <Link href='/en/' className={styles.homeButton}>
                            <ArrowLeft size={16} />
                            Back to Home
                        </Link>
                        <Link href="/products" className={styles.productsButton}>
                            Browse Products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotFound;