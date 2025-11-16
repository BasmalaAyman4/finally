'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    onClick,
    type = 'button',
    className = '',
    ...props
}, ref) => {
    const buttonClasses = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        loading && styles.loading,
        className
    ].filter(Boolean).join(' ');

    const MotionButton = motion.button;

    return (
        <MotionButton
            ref={ref}
            type={type}
            className={buttonClasses}
            disabled={disabled || loading}
            onClick={onClick}
            whileTap={disabled || loading ? {} : { scale: 0.98 }}
            whileHover={disabled || loading ? {} : { scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...props}
        >
            {loading && (
                <span className={styles.spinner} aria-hidden="true" />
            )}
            
            {!loading && icon && iconPosition === 'left' && (
                <span className={styles.iconLeft}>{icon}</span>
            )}
            
            <span className={styles.content}>{children}</span>
            
            {!loading && icon && iconPosition === 'right' && (
                <span className={styles.iconRight}>{icon}</span>
            )}
        </MotionButton>
    );
});

Button.displayName = 'Button';

export default Button;