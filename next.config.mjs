// Coveo Headless calls the org's platform/analytics hosts directly from the browser (search
// token flow) and the Search Agent chat widget streams from our own /api routes only — so
// connect-src only needs to allow the Coveo cloud/org host families, not a broader wildcard.
const COVEO_CONNECT_SRC = "https://*.cloud.coveo.com https://*.org.coveo.com";

// Next.js dev mode's webpack bundler evaluates chunks via eval() for fast-refresh source maps,
// so script-src needs 'unsafe-eval' in development or the client bundle never executes (blank
// hydration, every Headless-driven panel stuck loading). Production doesn't eval, so it stays strict.
const scriptSrc = ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV !== "production" ? ["'unsafe-eval'"] : [])].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js injects its own inline hydration/RSC-payload <script> tags on every page load; a
  // strict nonce-based script-src would need per-request middleware plumbing that's out of scope
  // for this pass, so 'unsafe-inline' is required here for the app to boot at all. This still
  // blocks loading any *external* script from a non-'self' origin, which is the more common
  // injection vector for this app's actual attack surface (no user-controlled script sources).
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  `connect-src 'self' ${COVEO_CONNECT_SRC}`,
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
