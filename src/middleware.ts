import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 1. Define the path we are on
    const path = request.nextUrl.pathname;

    // 2. Define public paths that don't need auth
    const isPublicPath = path === '/login' || path.startsWith('/_next') || path.startsWith('/static') || path.includes('favicon.ico');

    // 3. Get the token from cookies
    const token = request.cookies.get('auth_token')?.value;

    // 4. Redirect logic

    // If we have a token and try to go to login, send to home
    if (isPublicPath && token === 'authenticated') {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    // If we don't have a token and are on a protected path, send to login
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
    matcher: [
        '/',
        '/claim/:path*',
        '/api/search-claim',
        '/api/generate-report',
        '/login'
    ],
};
