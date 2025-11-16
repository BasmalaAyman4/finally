'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Card from '@/components/ui/Card/Card';
import styles from './arrived.module.css';
const ArrivedProducts = ({ arrivedProducts }) => {
    const sectionRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const maxSlides = Math.ceil(arrivedProducts.length / 3) - 1;

    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const cardWidth = 320; // card width + gap
        const newSlide = Math.round(container.scrollLeft / cardWidth / 3);
        setCurrentSlide(Math.min(newSlide, maxSlides));
    };

    const scrollToSlide = (slideIndex) => {
        if (!scrollContainerRef.current) return;
        const cardWidth = 320;
        const scrollPosition = slideIndex * cardWidth * 3;
        scrollContainerRef.current.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);



    return (
        <section ref={sectionRef} className={styles.section}>
            <div className={styles.container}>
                <motion.div
                    className={styles.content}
                    initial={{ opacity: 0, x: -100 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <p className={styles.subtitle}>Recently Arrived – Products of the Week</p>
                    <h2 className={styles.title}>
                        Latest Worthwhile
                        <br />
                        Collections
                    </h2>
                </motion.div>

                <motion.div
                    className={styles.productsWrapper}
                    initial={{ opacity: 0, x: 100 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                >
                    <div
                        className={styles.productsContainer}
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div className={styles.productsGrid}>
                            {arrivedProducts.map((product, index) => (
                                <motion.div
                                    key={product.productId}
                                    className={styles.productWrapper}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                    transition={{
                                        duration: 0.6,
                                        ease: "easeOut",
                                        delay: 0.4 + (index * 0.1)
                                    }}
                                >
                                    <Card product={product} />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.pagination}>
                        {Array.from({ length: maxSlides + 1 }, (_, index) => (
                            <button
                                key={index}
                                className={`${styles.paginationDot} ${currentSlide === index ? styles.active : ''
                                    }`}
                                onClick={() => scrollToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>

    )
}

export default ArrivedProducts
