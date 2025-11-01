import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/complaints(.*)",
  "/api/public(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isPublicRoute(req)) return;

  if (!userId) {
    // Use Next.js NextRequest's nextUrl
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
  signInUrl.searchParams.set("redirectUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
