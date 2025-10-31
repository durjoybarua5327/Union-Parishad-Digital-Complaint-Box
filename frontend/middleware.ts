import { NextResponse } from 'next/server';
import { withClerkMiddleware, getAuth, clerkClient } from '@clerk/nextjs/server';


export default withClerkMiddleware(async (request) => {
  const { userId } = getAuth(request);

  // Public routes that anyone can access
  const publicPaths = [
    '/',
    '/sign-in*',
    '/sign-up*',
    '/complaints',
    '/complaints/(.*)',
    '/api/public/complaints',
  ];

  // Check if the current path is public
  const isPublic = publicPaths.find(path => {
    const regex = new RegExp(`^${path.replace(/\*/g, '.*')}$`);
    return regex.test(request.nextUrl.pathname);
  });

  // Allow public routes or authenticated users
  if (isPublic || userId) {
    // If route starts with /admin, check for admin role
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!userId) {
        // Redirect unauthenticated users to sign-in
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect_url', request.url);
        return NextResponse.redirect(signInUrl);
      }

      // Fetch user metadata from Clerk
      const user = await clerkClient.users.getUser(userId);

      // Check if user role is ADMIN
      if (user.publicMetadata.role !== 'ADMIN') {
        // Redirect non-admin users to homepage or unauthorized page
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  }

  // Redirect unauthenticated users for non-public routes
  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('redirect_url', request.url);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    // Match all request paths except the ones starting with:
    // api/public, _next/static, _next/image, favicon.ico
    '/((?!api/public|_next/static|_next/image|favicon.ico).*)',
  ],
};
