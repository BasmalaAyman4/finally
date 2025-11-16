// lib/i18n/config.js

export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ar']
}

export function getLocaleFromPathname(pathname) {
  const segments = pathname.split('/')
  const locale = segments[1]
  return i18n.locales.includes(locale) ? locale : i18n.defaultLocale
}