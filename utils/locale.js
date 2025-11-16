// utils/locale.js

/**
 * تحويل locale إلى langCode للـ API
 * @param {string} locale - 'en' or 'ar'
 * @returns {string} '1' for Arabic, '2' for English
 */
export const getApiLangCode = (locale) => {
    return locale === 'en' ? '2' : '1';
};

/**
 * تحويل langCode إلى locale
 * @param {string} langCode - '1' or '2'
 * @returns {string} 'ar' or 'en'
 */
export const getLocaleFromLangCode = (langCode) => {
    return langCode === '2' ? 'en' : 'ar';
};

/**
 * التحقق من صحة locale
 * @param {string} locale
 * @returns {boolean}
 */
export const isValidLocale = (locale) => {
    return ['ar', 'en'].includes(locale);
};

/**
 * الحصول على اتجاه النص
 * @param {string} locale
 * @returns {'rtl' | 'ltr'}
 */
export const getTextDirection = (locale) => {
    return locale === 'ar' ? 'rtl' : 'ltr';
};