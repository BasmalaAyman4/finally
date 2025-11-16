
'use client'
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import localFont from 'next/font/local';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import styles from './brand.module.css'
const myFont = localFont({
  src: '../../../public/fonts/Quentin.otf',
})
const BrandHome = ({ brands }) => {
      const sectionRef = useRef(null);
        const containerRef = useRef(null);
      
      const isInView = useInView(sectionRef, { once: true, threshold: 0.1 });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Auto scroll functionality - moves one brand at a time
    useEffect(() => {
        if (isHovered) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % brands.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isHovered]);

    // Get visible brands (5 consecutive brands)
    const getVisibleBrands = () => {
        const visible = [];
        for (let i = 0; i < 5; i++) {
            const index = (currentIndex + i) % brands.length;
            visible.push(brands[index]);
        }
        return visible;
    };

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + brands.length) % brands.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % brands.length);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };
    const titleVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const visibleBrands = getVisibleBrands();

  return (
      <motion.section
          ref={sectionRef}
          className={styles.section}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
      >
          <div className={styles.container}>
              <motion.div className={styles.header} variants={titleVariants}>
                  <h2 className={`${styles.title} ${myFont.className}`}>
                      Shop By Brand
                  </h2>
                  <p className={styles.subtitle}>
                      Express your style with our standout collection.
                  </p>
              </motion.div>
              <p className={`${styles.categorySpecial} ${myFont.className}`}>Beauty</p>

              <div
                  className={styles.carouselWrapper}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
              >
                  <AnimatePresence>
                      {isHovered && (
                          <>
                              <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={handlePrevious}
                                  className={`${styles.navButton} ${styles.navButtonLeft}`}
                              >
                                  <ChevronLeft className={styles.navIcon} />
                              </motion.button>
                              <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={handleNext}
                                  className={`${styles.navButton} ${styles.navButtonRight}`}
                              >
                                  <ChevronRight className={styles.navIcon} />
                              </motion.button>
                          </>
                      )}
                  </AnimatePresence>

                  {/* Brands Container - Horizontal layout like the image */}
                  <motion.div
                      className={styles.brandsContainer}
                      key={currentIndex}
                      ref={containerRef}
                      variants={containerVariants}
                     
                  >
                      {visibleBrands.map((brand, index) => {
                          const isNewCard = index === visibleBrands.length - 1; // آخر كارت هو الجديد
                          return (
                              <motion.div
                                  key={brand.id}
                                  className={styles.brandItem}
                                  initial={isNewCard ? { scale: 0.5, opacity: 0 } : false} // بس الجديد يبدأ من زووم إن
                                  animate={isNewCard ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
                                  transition={{
                                      duration: isNewCard ? 0.6 : 0.3,
                                      ease: "easeOut"
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                              >
                                  <div className={styles.brandCard}>
                                      <div className={styles.brandImageContainer}>
                                          <Image
                                              width={250}
                                              height={250}
                                              src={brand?.imageUrl}
                                              alt={brand?.name}
                                              className={styles.brandImage}
                                              onError={(e) => { e.target.src = `https://via.placeholder.com/150x150/f3f4f6/9ca3af?text=${brand.name}`; }}
                                          />
                                      </div>
                                  </div>
                              </motion.div>
                          );
                      })}

                  </motion.div>
              </div>
          </div>
      </motion.section>
  )
}

export default BrandHome
