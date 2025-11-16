import React from 'react';
import styles from './ScrollingBanner.module.css'
const ScrollingBanner = () => {
    const bannerItems = [
        { text: "UP TO 50% OFF", highlight: true },
        { text: "SUMMER 2025", highlight: false },
        { text: "UP TO 50% OFF", highlight: true },
        { text: "SUMMER 2025", highlight: false },
    ];

    // Duplicate items for seamless loop
    const duplicatedItems = [...bannerItems, ...bannerItems, ...bannerItems, ...bannerItems];

    return (
        <div className={styles.scrollingBanner}>
            <div className={styles.scrollingContent}>
                {duplicatedItems.map((item, index) => (
                    <div
                        key={index}
                        className={`${styles.bannerItem} ${item.highlight ? styles.highlight : ''}`}
                    >
                        {item.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScrollingBanner;