'use client';

import { ZoomIn, ChevronLeft, ChevronRight, Plus, Minus, RotateCcw, X } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ProductDetails.module.css';
import Image from "next/image";

export const ImageGallery = ({ images, selectedImageIndex = 0, onImageChange }) => {
    const [currentIndex, setCurrentIndex] = useState(selectedImageIndex);
    const [showAllThumbnails, setShowAllThumbnails] = useState(false);
    const [showZoom, setShowZoom] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (selectedImageIndex !== currentIndex) {
            setCurrentIndex(selectedImageIndex);
        }
    }, [selectedImageIndex, currentIndex]);

    const nextImage = useCallback(() => {
        const newIndex = (currentIndex + 1) % images.length;
        setCurrentIndex(newIndex);
        onImageChange?.(newIndex);
    }, [currentIndex, images.length, onImageChange]);

    const prevImage = useCallback(() => {
        const newIndex = (currentIndex - 1 + images.length) % images.length;
        setCurrentIndex(newIndex);
        onImageChange?.(newIndex);
    }, [currentIndex, images.length, onImageChange]);

    const goToImage = useCallback((index) => {
        if (index >= 0 && index < images.length) {
            setCurrentIndex(index);
            onImageChange?.(index);
        }
    }, [images.length, onImageChange]);

    const toggleAllThumbnails = useCallback(() => {
        setShowAllThumbnails(prev => !prev);
    }, []);

    // Reset zoom when image changes
    useEffect(() => {
        if (showZoom) {
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
            setIsDragging(false);
        }
    }, [currentIndex, showZoom]);

    const handleImageZoom = useCallback(() => {
        setShowZoom(true);
    }, []);

    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.5, 4));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.3 : 0.3;
        const newZoomLevel = Math.min(Math.max(zoomLevel + delta, 1), 4);
        setZoomLevel(newZoomLevel);

        if (newZoomLevel <= 1) {
            setPanOffset({ x: 0, y: 0 });
        }
    }, [zoomLevel]);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - panOffset.x,
                y: e.clientY - panOffset.y
            });
            document.body.style.cursor = 'grabbing';
        }
    }, [zoomLevel, panOffset]);

    const handleMouseMove = useCallback((e) => {
        if (isDragging && zoomLevel > 1) {
            e.preventDefault();
            const maxPan = 200 * zoomLevel;
            setPanOffset({
                x: Math.max(-maxPan, Math.min(maxPan, e.clientX - dragStart.x)),
                y: Math.max(-maxPan, Math.min(maxPan, e.clientY - dragStart.y))
            });
        }
    }, [isDragging, dragStart, zoomLevel]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = 'default';
    }, []);

    const closeZoom = useCallback(() => {
        setShowZoom(false);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        setIsDragging(false);
        document.body.style.cursor = 'default';
    }, []);

    // Keyboard navigation - optimized dependency array
    useEffect(() => {
        if (!showZoom) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'Escape':
                    closeZoom();
                    break;
                case 'ArrowLeft':
                    prevImage();
                    break;
                case 'ArrowRight':
                    nextImage();
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                    handleZoomOut();
                    break;
                case '0':
                    handleResetZoom();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [showZoom, closeZoom, nextImage, prevImage, handleZoomIn, handleZoomOut, handleResetZoom]);

    if (!images?.length) {
        return (
            <div className={styles.mainImageContainer}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    height: '100%',
                    color: '#999'
                }}>
                    <p className={styles.noImageIcon}>📷</p>
                    <p>No image available</p>
                </div>
            </div>
        );
    }

    const validCurrentIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
    const currentImage = images[validCurrentIndex];
    const displayedImages = showAllThumbnails ? images : images.slice(0, 4);
    const remainingCount = images.length - 4;

    return (
        <>
            <div className={styles.imageSection}>
                <div className={styles.mainImageContainer}>
                    <motion.div
                        key={validCurrentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Image
                            src={currentImage.fileLink}
                            alt={`Product image ${validCurrentIndex + 1}`}
                            className={styles.mainImage}
                            onClick={handleImageZoom}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority={validCurrentIndex === 0}
                            quality={85}
                        />
                    </motion.div>

                    <div className={styles.zoomIndicator}>
                        <ZoomIn size={16} />
                    </div>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className={`${styles.navigationButton} ${styles.prevButton}`}
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextImage}
                                className={`${styles.navigationButton} ${styles.nextButton}`}
                                aria-label="Next image"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                </div>

                {images.length > 1 && (
                    <div className={styles.thumbnailContainer}>
                        {displayedImages.map((image, index) => (
                            <button
                                key={image.fileLink || index}
                                onClick={() => goToImage(index)}
                                className={`${styles.thumbnail} ${index === validCurrentIndex ? styles.active : ''}`}
                                aria-label={`View image ${index + 1}`}
                            >
                                <Image
                                    src={image.fileLink}
                                    alt={`Thumbnail ${index + 1}`}
                                    className={styles.thumbnailImage}
                                    fill
                                    sizes="80px"
                                    quality={60}
                                />
                            </button>
                        ))}

                        {!showAllThumbnails && remainingCount > 0 && (
                            <button
                                onClick={toggleAllThumbnails}
                                className={`${styles.moreImages} ${styles.moreImagesButton}`}
                                aria-label={`Show ${remainingCount} more images`}
                            >
                                <span>+{remainingCount}</span>
                            </button>
                        )}

                        {showAllThumbnails && images.length > 4 && (
                            <button
                                onClick={toggleAllThumbnails}
                                className={`${styles.moreImages} ${styles.moreImagesButton} ${styles.showLessButton}`}
                                aria-label="Show fewer images"
                            >
                                <span>Show less</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showZoom && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.zoomModal}
                        onClick={closeZoom}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <button
                            onClick={closeZoom}
                            className={styles.zoomCloseButton}
                            aria-label="Close zoom"
                        >
                            <X size={20} />
                        </button>

                        <div
                            className={styles.zoomControls}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={handleZoomOut} className={styles.zoomButton} aria-label="Zoom out">
                                <Minus size={18} />
                            </button>
                            <span className={styles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={handleZoomIn} className={styles.zoomButton} aria-label="Zoom in">
                                <Plus size={18} />
                            </button>
                            <button onClick={handleResetZoom} className={styles.zoomButton} aria-label="Reset zoom">
                                <RotateCcw size={18} />
                            </button>
                        </div>

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevImage();
                                    }}
                                    className={`${styles.zoomNavigationButton} ${styles.zoomPrevButton}`}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextImage();
                                    }}
                                    className={`${styles.zoomNavigationButton} ${styles.zoomNextButton}`}
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}

                        {images.length > 1 && (
                            <div className={styles.imageCounter} onClick={(e) => e.stopPropagation()}>
                                {validCurrentIndex + 1} of {images.length}
                            </div>
                        )}

                        <Image
                            src={currentImage.fileLink}
                            alt={`Zoomed product image ${validCurrentIndex + 1}`}
                            className={styles.zoomImage}
                            fill
                            quality={95}
                            sizes="100vw"
                            style={{
                                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                                transformOrigin: 'center center',
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                                userSelect: 'none',
                                pointerEvents: 'auto'
                            }}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (zoomLevel <= 1.5) {
                                    setZoomLevel(2);
                                }
                            }}
                            draggable={false}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};