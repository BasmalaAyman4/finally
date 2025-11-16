/* // auth.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiLangCode } from "./utils/locale";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

/**
 * Refresh the access token using refresh token
 *
async function refreshAccessToken(token) {
    try {
        console.log('🔄 Attempting to refresh token...');

        const response = await fetch(
            `${API_URL}/api/Auth/refreshToken?refreshToken=${encodeURIComponent(token.refreshToken)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Type': 'web',
                },
            }
        );

        console.log('Refresh response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token refresh failed:', errorText);
            throw new Error('Token refresh failed');
        }

        const refreshedTokens = await response.json();
        console.log('✅ Token refreshed successfully');

        return {
            ...token,
            accessToken: refreshedTokens.token,
            refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
            accessTokenExpires: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days
            error: undefined,
        };
    } catch (error) {
        console.error('❌ Token refresh error:', error);
        return {
            ...token,
            error: "RefreshAccessTokenError"
        };
    }
}

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
    csrf: true,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                mobile: { label: "Mobile", type: "text" },
                password: { label: "Password", type: "password" },
                locale: { label: "Locale", type: "text" },
            },
            async authorize(credentials) {
                try {
                    const locale = credentials.locale || 'ar';

                    const response = await fetch(`${API_URL}/api/Auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'langCode': getApiLangCode(locale),
                            'X-Client-Type': 'web',
                        },
                        body: JSON.stringify({
                            mobile: credentials.mobile,
                            password: credentials.password,
                        }),
                    });

                    if (!response.ok) {
                        return null;
                    }

                    const data = await response.json();

                    return {
                        id: data.userId?.toString() || data.id?.toString(),
                        mobile: data.lastMobileDigit || credentials.mobile,
                        token: data.token,
                        refreshToken: data.refreshToken,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        userName: data.userName || '',
                        email: data.email || null,
                        address: data.address || null,
                        gender: data.gender || null,
                        isSeller: data.isSeller || false,
                        verify: data.verify || false,
                        createdDate: data.createdDate || null,
                    };

                } catch (error) {
                    console.error('Authorization error:', error);
                    return null;
                }
            },
        }),
    ],

    pages: {
        signIn: '/ar/signin',
        error: '/ar/error',
    },

    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            // Initial sign in - token expires in 15 minutes
            if (account && user) {
                console.log('🔐 Initial sign in - token expires in 15 min');
                return {
                    ...token,
                    accessToken: user.token,
                    refreshToken: user.refreshToken,
                    accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
                    userId: user.id,
                    mobile: user.mobile,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userName: user.userName,
                    email: user.email,
                    address: user.address,
                    gender: user.gender,
                    isSeller: user.isSeller,
                    verify: user.verify,
                    createdDate: user.createdDate,
                };
            }

            // Handle manual session updates
            if (trigger === "update" && session) {
                console.log('🔄 Manual token update triggered');
                if (session.accessToken) {
                    return {
                        ...token,
                        accessToken: session.accessToken,
                        refreshToken: session.refreshToken ?? token.refreshToken,
                        accessTokenExpires: Date.now() + 2 * 24 * 60 * 60 * 1000,
                        error: undefined,
                    };
                }
            }

            // Return token if not expired (with 2 minute buffer)
            if (Date.now() < token.accessTokenExpires - 2 * 60 * 1000) {
                return token;
            }

            // Token expired or expiring soon, refresh it
            console.log('⚠️ Token expired/expiring, triggering refresh...');
            return refreshAccessToken(token);
        },

        async session({ session, token }) {
            // Send properties to the client
            session.user.id = token.userId;
            session.user.mobile = token.mobile;
            session.user.firstName = token.firstName;
            session.user.lastName = token.lastName;
            session.user.userName = token.userName;
            session.user.email = token.email;
            session.user.address = token.address;
            session.user.gender = token.gender;
            session.user.isSeller = token.isSeller;
            session.user.verify = token.verify;
            session.user.createdDate = token.createdDate;
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.error = token.error;
            session.accessTokenExpires = token.accessTokenExpires;

            return session;
        },
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,
}); */

// auth.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiLangCode } from "./utils/locale";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

/**
 * FIXED: Refresh the access token using refresh token
 */
async function refreshAccessToken(token) {
    try {
        console.log('🔄 Attempting to refresh token...');
        console.log('Current token expires at:', new Date(token.accessTokenExpires));

        const response = await fetch(
            `${API_URL}/api/Auth/refreshToken?refreshToken=${encodeURIComponent(token.refreshToken)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Type': 'web',
                },
            }
        );

        console.log('Refresh response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Token refresh failed:', errorText);
            throw new Error('Token refresh failed');
        }

        const refreshedTokens = await response.json();
        console.log('✅ Token refreshed successfully');
        console.log('New token expires in 2 days');

        return {
            ...token,
            accessToken: refreshedTokens.token,
            refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
            accessTokenExpires: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days
            error: undefined,
        };
    } catch (error) {
        console.error('❌ Token refresh error:', error);
        return {
            ...token,
            error: "RefreshAccessTokenError"
        };
    }
}

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
    csrf: true,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                mobile: { label: "Mobile", type: "text" },
                password: { label: "Password", type: "password" },
                locale: { label: "Locale", type: "text" },
            },
            async authorize(credentials) {
                try {
                    const locale = credentials.locale || 'ar';

                    const response = await fetch(`${API_URL}/api/Auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'langCode': getApiLangCode(locale),
                            'X-Client-Type': 'web',
                        },
                        body: JSON.stringify({
                            mobile: credentials.mobile,
                            password: credentials.password,
                        }),
                    });

                    if (!response.ok) {
                        return null;
                    }

                    const data = await response.json();

                    return {
                        id: data.userId?.toString() || data.id?.toString(),
                        mobile: data.lastMobileDigit || credentials.mobile,
                        token: data.token,
                        refreshToken: data.refreshToken,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        userName: data.userName || '',
                        email: data.email || null,
                        address: data.address || null,
                        gender: data.gender || null,
                        isSeller: data.isSeller || false,
                        verify: data.verify || false,
                        createdDate: data.createdDate || null,
                    };

                } catch (error) {
                    console.error('Authorization error:', error);
                    return null;
                }
            },
        }),
    ],

    pages: {
        signIn: '/ar/signin',
        error: '/ar/error',
    },

    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            // Initial sign in - token expires in 15 minutes
            if (account && user) {
                console.log('🔐 Initial sign in - token expires in 15 min');
                return {
                    ...token,
                    accessToken: user.token,
                    refreshToken: user.refreshToken,
                    accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
                    userId: user.id,
                    mobile: user.mobile,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userName: user.userName,
                    email: user.email,
                    address: user.address,
                    gender: user.gender,
                    isSeller: user.isSeller,
                    verify: user.verify,
                    createdDate: user.createdDate,
                };
            }

            // Handle manual session updates (from update() calls)
            if (trigger === "update" && session) {
                console.log('🔄 Manual token update triggered');
                if (session.accessToken) {
                    return {
                        ...token,
                        accessToken: session.accessToken,
                        refreshToken: session.refreshToken ?? token.refreshToken,
                        accessTokenExpires: Date.now() + 2 * 24 * 60 * 60 * 1000,
                        error: undefined,
                    };
                }
            }

            // FIXED: Check if token needs refresh (with 3 minute buffer instead of 2)
            const timeUntilExpiry = token.accessTokenExpires - Date.now();

            if (timeUntilExpiry > 3 * 60 * 1000) {
                // Token is still valid for more than 3 minutes
                return token;
            }

            // Token expired or expiring soon, refresh it
            console.log(`⚠️ Token expiring in ${Math.floor(timeUntilExpiry / 60000)} minutes, refreshing...`);
            return refreshAccessToken(token);
        },

        async session({ session, token }) {
            // Send properties to the client
            session.user.id = token.userId;
            session.user.mobile = token.mobile;
            session.user.firstName = token.firstName;
            session.user.lastName = token.lastName;
            session.user.userName = token.userName;
            session.user.email = token.email;
            session.user.address = token.address;
            session.user.gender = token.gender;
            session.user.isSeller = token.isSeller;
            session.user.verify = token.verify;
            session.user.createdDate = token.createdDate;
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.error = token.error;
            session.accessTokenExpires = token.accessTokenExpires;

            return session;
        },
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,
});