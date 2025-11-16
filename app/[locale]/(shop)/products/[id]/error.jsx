'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import styles from './styles/NotFound.module.css';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Product page error:', error);
    }, [error]);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <AlertCircle className={styles.icon} size={64} />
                <h2 className={styles.title}>Something went wrong!</h2>
                <p className={styles.message}>
                    We encountered an error while loading the product details.
                </p>
                <button
                    onClick={reset}
                    className={styles.retryButton}
                >
                    <RefreshCw size={16} />
                    Try again
                </button>
            </div>
        </div>
    );
}