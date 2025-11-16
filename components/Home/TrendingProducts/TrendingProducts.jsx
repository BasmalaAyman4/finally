'use client'
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './trending.module.css'
import localFont from 'next/font/local';
import AutoScrollSlider from '@/components/common/SliderProducts/AutoScrollSlider';
const myFont = localFont({
  src: '../../../public/fonts/Quentin.otf',
})
const TrendingProducts = ({ popularProducts , productDiscounts }) => {
    const [activeFilter, setActiveFilter] = useState('bestSeller');
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const buttonRefs = useRef({});
    const tabs = [
        { id: 'bestSeller', label: 'Best Seller' },
        { id: 'deals', label: 'Deals Of Day' }
    ];
    const getCurrentProducts = () => {
        switch (activeFilter) {
            case 'bestSeller': return popularProducts;
            case 'deals': return productDiscounts;
            default: return popularProducts;
        }
    };
    const topProducts = getCurrentProducts().slice(0, 5);
    const bottomProducts = getCurrentProducts().slice(5);
    useEffect(() => {
        const activeButton = buttonRefs.current[activeFilter];
        if (activeButton) {
            const { offsetLeft, offsetWidth } = activeButton;
            setIndicatorStyle({
                left: offsetLeft,
                width: offsetWidth,
            });
        }
    }, [activeFilter]);
  return (
      <section className={styles.trend__sec}>
          <div className={styles.trend__body}>
              <h2>Trending Products</h2>
              <div className={styles.trend__options} style={{ position: 'relative' }}>
                  {tabs.map((tab) => (
                      <button
                          key={tab.id}
                          ref={(el) => buttonRefs.current[tab.id] = el}
                          onClick={() => setActiveFilter(tab.id)}
                          className={activeFilter === tab.id ? styles.active : styles.option}
                          style={{
                              position: 'relative',
                              background: 'transparent',
                              textAlign: 'center',
                              zIndex: 2
                          }}
                      >
                          <span style={{ position: 'relative', zIndex: 3 ,fontSize:'22px' }} >
                              {tab.label}
                          </span>
                      </button>
                  ))}

                 {/*  <motion.div
                      className={styles.activeIndicator}
                      animate={indicatorStyle}
                      initial={false}
                      transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          mass: 0.5
                      }}
                      style={{
                          position: 'absolute',
                          top: 0,
                          height: '100%',
                          borderBottom: '2px #FE8787 solid',
                          borderRadius: '18px',
                          zIndex: 1
                      }}
                  /> */}
              </div>
          </div>
          <AnimatePresence mode="wait">
              <motion.div
                  key={activeFilter}
                  className={styles.cards__body}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                      duration: 0.3,
                      ease: "easeInOut"
                  }}
              >
                 
                      <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                      transition={{
                          duration: 0.2,
                          delay:   0.05,
                          ease: "easeOut"
                      }}
                      >
                          <AutoScrollSlider products={topProducts} direction="left" />
                          <AutoScrollSlider products={bottomProducts} direction="right" />
                      </motion.div>
              
              </motion.div>
          </AnimatePresence>
      </section>
  )
}

export default TrendingProducts
