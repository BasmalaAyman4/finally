import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SUPPORTED_LOCALES = ["en", "ar"];
const DEFAULT_LOCALE = "ar";
const LOCALE_REGEX = /^\/([a-zA-Z]{2})(\/|$)/;

const PROTECTED_ROUTES = ['/profile', '/orders', '/wishlist', '/cart', '/checkout'];
const AUTH_ROUTES = ['/signin', '/signup'];

/**
 * ✅ HTTPS Enforcement - DISABLED (Let Nginx handle it)
 * This prevents redirect loops when Nginx is not properly configured
 */
function enforceHTTPS(request) {
    // HTTPS enforcement is now handled by Nginx/reverse proxy
    // This prevents ERR_TOO_MANY_REDIRECTS
    return null;
}

/**
 * إضافة Security Headers
 */
function addSecurityHeaders(response) {
    // HTTPS Strict Transport Security
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
    );

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

  /*   response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "connect-src 'self' https://api.lajolie-eg.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "object-src 'none'; " +
        "img-src 'self' data: blob: https:; " +
        "upgrade-insecure-requests;"
    ); */


    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "connect-src 'self' https://api.lajolie-eg.com https://cdn.jsdelivr.net; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "worker-src 'self' blob:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "object-src 'none'; " +
        "img-src 'self' data: blob: https:; " +
        "upgrade-insecure-requests;"
    );
    return response;
}

function isProtectedRoute(pathname, locale) {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    return PROTECTED_ROUTES.some(route =>
        pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
    );
}

function isAuthRoute(pathname, locale) {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    return AUTH_ROUTES.some(route =>
        pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
    );
}

export async function middleware(req) {
    // ✅ 1. أول حاجة: HTTPS Enforcement
    const httpsRedirect = enforceHTTPS(req);
    if (httpsRedirect) {
        return httpsRedirect;
    }

    const { pathname } = req.nextUrl;

    // تجاهل مسارات السيستم
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.match(/\.(.*)$/)
    ) {
        return NextResponse.next();
    }

    // استخراج الـ locale
    const match = pathname.match(LOCALE_REGEX);
    const locale = match?.[1];

    // Locale validation
    if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
        const url = req.nextUrl.clone();
        url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
        const res = NextResponse.redirect(url);
        return addSecurityHeaders(res);
    }

    // Session check
    const session = await auth();
    const isAuthenticated = !!session?.user;

    // Protected routes
    if (isProtectedRoute(pathname, locale) && !isAuthenticated) {
        const url = req.nextUrl.clone();
        url.pathname = `/${locale}/signin`;
        url.searchParams.set('callbackUrl', pathname);
        const res = NextResponse.redirect(url);
        return addSecurityHeaders(res);
    }

    // Auth routes (لو مسجل دخول)
    if (isAuthRoute(pathname, locale) && isAuthenticated) {
        const url = req.nextUrl.clone();
        url.pathname = `/${locale}`;
        const res = NextResponse.redirect(url);
        return addSecurityHeaders(res);
    }

    // كل شيء تمام
    const res = NextResponse.next();
    return addSecurityHeaders(res);
}

export const config = {
    matcher: [
        "/((?!_next|api|.*\\..*).*)",
    ],
};