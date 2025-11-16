'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from './saleBanner.module.css';

const SaleBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if banner has been shown before in this session
        const bannerShown = sessionStorage.getItem('saleBannerShown');

        // Only show banner if it hasn't been shown before
        if (!bannerShown) {
            setIsVisible(true);
            // Mark as shown for this session
            sessionStorage.setItem('saleBannerShown', 'true');
        }
    }, []);

    const handleShopNow = () => {
        setIsVisible(false);
    };
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -50 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                    }}
                    exit={{
                        opacity: 0,
                        scale: 0,
                        y: -50,
                        transition: { duration: 0 }
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        delay: 0.5 // Delay the entrance animation
                    }}
                    className={styles.bannerOverlay}
                    onClick={handleShopNow}

                >
                    <motion.div
                        initial={{ rotateY: -90 }}
                        animate={{ rotateY: 0 }}
                        transition={{
                            delay: 1,
                            duration: 0.6,
                            type: "spring",
                            stiffness: 100
                        }}
                        className={styles.bannerContainer}
                    >
                        <div className={styles.box}>
                            <svg
                                className={styles.box__background}
                                viewBox="0 0 800 800"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    id="line1"
                                    d="M251.994 21.5L251.995 190.5C251.995 212.591 269.903 230.5 291.995 230.5L517.5 230.5C539.592 230.5 557.5 248.409 557.5 270.5L557.5 275.5C557.5 297.591 575.409 315.5 597.5 315.5L759 315.5"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="40"
                                    strokeLinecap="round"
                                />
                                <path
                                    id="line2"
                                    d="M20.5001 451L226 451C248.091 451 266 468.909 266 491L266 530C266 552.091 283.908 570 306 570L475.5 570C497.591 570 515.5 587.909 515.5 610L515.5 776.5"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="40"
                                    strokeLinecap="round"
                                />

                                <text fill="#fff" fontSize="24" fontWeight="bold">
                                    <textPath startOffset="0%" textAnchor="middle" alignmentBaseline="central" xlinkHref="#line1">
                                        WEEKEND SALE EVENT
                                        <animate
                                            attributeName="startOffset"
                                            from="0%"
                                            to="100%"
                                            begin="0s"
                                            dur="6s"
                                            repeatCount="indefinite"
                                        />
                                    </textPath>
                                </text>

                                <text fill="#fff" fontSize="24" fontWeight="bold">
                                    <textPath startOffset="0%" textAnchor="middle" alignmentBaseline="central" xlinkHref="#line1">
                                        WEEKEND SALE EVENT
                                        <animate
                                            attributeName="startOffset"
                                            from="0%"
                                            to="100%"
                                            begin="3s"
                                            dur="6s"
                                            repeatCount="indefinite"
                                        />
                                    </textPath>
                                </text>

                                <text fill="#fff" fontSize="28" fontWeight="bold">
                                    <textPath startOffset="0%" textAnchor="middle" alignmentBaseline="central" xlinkHref="#line2">
                                        ONE DAY SPECIAL
                                        <animate
                                            attributeName="startOffset"
                                            from="0%"
                                            to="100%"
                                            begin="0s"
                                            dur="6s"
                                            repeatCount="indefinite"
                                        />
                                    </textPath>
                                </text>

                                <text fill="#fff" fontSize="28" fontWeight="bold">
                                    <textPath startOffset="0%" textAnchor="middle" alignmentBaseline="central" xlinkHref="#line2">
                                        SPECIAL OFFER
                                        <animate
                                            attributeName="startOffset"
                                            from="0%"
                                            to="100%"
                                            begin="3s"
                                            dur="6s"
                                            repeatCount="indefinite"
                                        />
                                    </textPath>
                                </text>
                            </svg>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, duration: 0.6 }}
                                className={styles.box__content}
                            >
                                <motion.h2
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        delay: 2,
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 10
                                    }}
                                    className={styles.bannerTitle}
                                >
                                    Get up to{' '}
                                    <motion.span
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            textShadow: [
                                                "0 0 0px rgba(255,255,255,0)",
                                                "0 0 20px rgba(255,255,255,0.8)",
                                                "0 0 0px rgba(255,255,255,0)"
                                            ]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatType: "reverse"
                                        }}
                                        className={styles.discountText}
                                    >
                                        50%
                                    </motion.span>{' '}
                                    off
                                </motion.h2>

                                <motion.button
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 2.5, duration: 0.4 }}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleShopNow}
                                    className={styles.box__btn}
                                >
                                    Shop Now
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SaleBanner;