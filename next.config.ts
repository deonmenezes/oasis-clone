import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  // Defense-in-depth: even though we never embed the service-role key client-side,
  // these headers reduce blast radius from any third-party script injection.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://bgdnvaurwogjqxhadozf.supabase.co https://connect.live-oasis.com https://inruqrymqosbfeygykdx.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://bgdnvaurwogjqxhadozf.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Silence the multi-lockfile warning by pinning the workspace root to this app.
  turbopack: { root: __dirname },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
