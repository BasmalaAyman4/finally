'use client';

import { Component } from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.container}>
                    <div className={styles.content}>
                        <h2 className={styles.title}>Something went wrong</h2>
                        <p className={styles.message}>
                            We are sorry, but something unexpected happened. Please try again.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className={styles.retryButton}
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;