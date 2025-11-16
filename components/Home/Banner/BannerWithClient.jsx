'use client';
import styles from "./banner.module.css";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import React from 'react'

const BannerWithClient = ({ banners }) => {
    const [active, setActive] = useState(1);
    const autoPlayRef = useRef(null);
    const countItem = banners?.length;

    const getOtherIndexes = (currentIndex) => {
        const other_1 = currentIndex - 1 < 0 ? countItem - 1 : currentIndex - 1;
        const other_2 = currentIndex + 1 >= countItem ? 0 : currentIndex + 1;
        return { other_1, other_2 };
    };

    const { other_1, other_2 } = getOtherIndexes(active);

    const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayRef.current = setInterval(() => {
            nextClick();
        }, 5000);
    };

    const stopAutoPlay = () => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
            autoPlayRef.current = null;
        }
    };

    const changeSlider = (newActive) => {
        setActive(newActive);
        startAutoPlay();
    };

    const nextClick = () => {
        const newActive = active + 1 >= countItem ? 0 : active + 1;
        changeSlider(newActive);
    };

    const prevClick = () => {
        const newActive = active - 1 < 0 ? countItem - 1 : active - 1;
        changeSlider(newActive);
    };

    useEffect(() => {
        startAutoPlay();
        return () => stopAutoPlay();
    }, []);
    return (
        <>
            <section className={`${styles.carousel} ${styles.next}`}>
                <div className={`${styles.list}`}>
                    {banners?.map((item, index) => (
                        <article
                            key={item.productId || index}
                            className={`${styles.item} ${index === active
                                    ? styles.active
                                    : index === other_1
                                        ? styles.other_1
                                        : index === other_2
                                            ? styles.other_2
                                            : ""
                                }`}
                        >
                            <div
                                className={`${styles.main__content}`}
                                style={{
                                    backgroundColor: `${item.firstColor}`
                                }}
                            >
                                <div className={`${styles.content}`}>
                                    <h2>{item.title}</h2>
                                    <p className={`${styles.description}`}>{item.description}</p>
                                
                                </div>
                            </div>
                            <figure className={`${styles.image}`}>
                                <Image src={item.imageUrl}
                                    alt={item.title}
                                    width={400}
                                    height={600} />
                                <figcaption>{item.title}</figcaption>
                            </figure>
                        </article>
                    ))}
                </div>
                <div className={`${styles.arrows}`}>
                    <button id="prev" className={`${styles.prev}`} onClick={prevClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><path d="M15.293 3.293 6.586 12l8.707 8.707 1.414-1.414L9.414 12l7.293-7.293-1.414-1.414z" /></svg>

                    </button>
                    <button id="next" className={`${styles.next}`} onClick={nextClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><path d="M7.293 4.707 14.586 12l-7.293 7.293 1.414 1.414L17.414 12 8.707 3.293 7.293 4.707z" /></svg>

                    </button>
                </div>
            </section>
        </>
    )
}


export default BannerWithClient
