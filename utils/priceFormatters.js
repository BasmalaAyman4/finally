const priceFormatters = new Map();

export const getCachedPriceFormatter = (locale) => {
    if (!priceFormatters.has(locale)) {
        priceFormatters.set(locale, new Intl.NumberFormat(
            locale === 'en' ? 'en-US' : 'ar-EG',
            {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        ));
    }
    return priceFormatters.get(locale);
};