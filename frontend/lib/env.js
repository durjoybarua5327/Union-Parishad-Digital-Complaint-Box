const isServer = typeof window === 'undefined';

const env = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
};

// Validate environment variables only on the server.
// Throwing during client-side evaluation breaks the browser bundle (runtime errors).
if (isServer) {
  const requiredServerEnv = ['CLERK_SECRET_KEY'];
  for (const envVar of requiredServerEnv) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required server environment variable: ${envVar}`);
    }
  }

  // NEXT_PUBLIC_ vars are required for client features, validate them during server startup/build
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }
} else {
  // Client-side: do not throw (would crash the page). Instead warn so devs can see the issue in console.
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    // eslint-disable-next-line no-console
    console.warn('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Some client features may not work as expected.');
  }
}

export default env;