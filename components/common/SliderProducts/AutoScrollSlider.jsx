'use client'
import { useEffect, useRef, useState } from "react";
import styles from './atoScrollSlider.module.css'
import Card from "@/components/ui/Card/Card";

const AutoScrollSlider = ({ products, direction }) => {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate animation duration based on number of products
  // This ensures consistent speed regardless of product count
  const calculateAnimationDuration = () => {
    // Base speed: 250px per second (adjust this value to change overall speed)
    const pixelsPerSecond = 70;
    // Each product takes about 250px (200px width + 50px gap)
    const productWidth = 250;
    const totalWidth = products.length * productWidth;
    return totalWidth / pixelsPerSecond;
  };

  const animationDuration = calculateAnimationDuration();

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div className={styles.sliderWrapper}>
      <div
        className={`${styles.sliderTrack} ${direction === "left" ? styles.scrollLeft : styles.scrollRight
          } ${isPaused ? styles.paused : ''}`}
        ref={containerRef}
        style={{
          animationDuration: `${animationDuration}s`
        }}
      >
        {[...products, ...products].map((product, idx) => (
          <div
            key={`${product.id || idx}-${idx}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Card product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutoScrollSlider;