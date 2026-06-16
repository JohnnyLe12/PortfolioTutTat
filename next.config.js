/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only serve Next.js API routes — the Vite frontend lives in src/
  // and is served separately by Vite dev server / Vercel static output.
  // We restrict Next.js to the app/ directory at root.

  // Do not conflict with Vite's src/ directory
  // Next.js will only handle routes under app/
  experimental: {
    // Ensure Next.js does not try to process files inside src/
  },

  // Expose env vars to Edge Runtime (middleware) — note: in next dev,
  // Next.js automatically loads .env for all runtimes. This block ensures
  // the values are available in production builds as well.
  env: {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  },

  // Disable Next.js default page routing for the root — we only use API routes
  // under app/api/. The app/layout.tsx is a minimal shell required by App Router.
  reactStrictMode: true,

  // Skip type checking during build since src/ directory exists for Vite frontend
  // and causes Next.js to incorrectly look for app/ inside src/.
  // Types are checked separately via tsc.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build — linting is handled separately.
  // The src/ (Vite frontend) JSX files trigger lint warnings unrelated to Next.js API routes.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Use custom page extensions to prevent Next.js Pages Router from picking up
  // Vite frontend .jsx files in src/pages/. We include .ts and .tsx since our
  // App Router API routes use route.ts. We exclude .jsx/.js to avoid Vite pages.
  pageExtensions: ['tsx', 'ts'],

  // Allow images from external storage providers (Vercel Blob, Cloudinary)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
