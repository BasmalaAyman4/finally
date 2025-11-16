'use client'
import React, { useEffect, useRef, useState } from "react";
import styles from "./categories.module.css";
import Image from "next/image";
import localFont from 'next/font/local';
import { motion, useInView } from 'framer-motion';
import catone from '@/assets/cat1.png'
import Link from "next/link";
const myFont = localFont({
  src: '../../../public/fonts/Quentin.otf',
})

const CategoriesHome = ({ categories,locale }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const sectionRef = useRef(null);
  const autoScrollRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 });
console.log(categories)
  const visibleCategories = 3; // Changed to 5 to match the image layout
  const totalGroups = Math.ceil(categories.length / visibleCategories);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, []);

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      nextGroup();
    }, 5000);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const nextGroup = () => {
    setCurrentIndex(prev => (prev + 1) % totalGroups);
  };

  const prevGroup = () => {
    setCurrentIndex(prev => (prev - 1 + totalGroups) % totalGroups);
  };

  const visibleItems = categories.slice(
    currentIndex * visibleCategories,
    (currentIndex + 1) * visibleCategories
  );

  const paddedItems = visibleItems.length < visibleCategories
    ? [...visibleItems, ...categories.slice(0, visibleCategories - visibleItems.length)]
    : visibleItems;

  // Animation variants
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

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
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

  return (
    <motion.section
      ref={sectionRef}
      className={`${styles.sec}`}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <motion.h2
        className={`${styles.h2} ${myFont.className}`}
        variants={titleVariants}
      >
        Shop By Category
      </motion.h2>

      <motion.p
        className={`${styles.p}`}
        variants={titleVariants}
      >
        Get gorgeous skin with natural-biocompatible skincare
      </motion.p>

<div>
  <Image src={catone} alt="Category Banner" className={styles.catone} />
</div>
      <div className={styles.categories__container}>
        <motion.div
          className={styles.categories__body}
          ref={containerRef}
          variants={containerVariants}
        >
          {paddedItems.map((category, index) => (
            <Link href={`/${locale}/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`} key={`${category.id}-${currentIndex}`}>
            <motion.div
              key={`${category.id}-${currentIndex}`}
              className={styles.category__wrapper}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`${styles.category}`}>
                <div className={styles.category__figure}>
                  <Image
                    alt={category.name}
                    className={styles.category__img}
                    src={category.imageUrl}
                    width={200}
                    height={200}
                    priority
                  />
                </div>
              </div>
              <motion.p
                className={` ${styles.categoryName}`}
                variants={itemVariants}
              >
                {category.name}
              </motion.p>
            </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* Dots indicator */}
      {totalGroups > 1 && (
        <motion.div
          className={styles.dots}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          {Array.from({ length: totalGroups }).map((_, index) => (
            <motion.button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                startAutoScroll();
              }}
              aria-label={`Go to group ${index + 1}`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </motion.div>
      )}
    </motion.section>
  )
}

export default CategoriesHome;