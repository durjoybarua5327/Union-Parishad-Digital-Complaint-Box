import { authMiddleware } from '@clerk/nextjs';

// Public routes that anyone can access
const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/complaints',
  '/complaints/(.*)',
  '/api/public/complaints',
];

export default authMiddleware({
  publicRoutes: publicRoutes,
  afterAuth(auth, req) {
    const { userId, isPublicRoute } = auth;
    const { pathname } = req.nextUrl;

    // If it's a public route, allow access
    if (isPublicRoute) return;

    // If user is not signed-in, redirect to sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Match all paths except Next.js static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};