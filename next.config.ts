import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/courses", destination: "/programs", permanent: true },
      { source: "/courses/medical-va", destination: "/programs/medical-va", permanent: true },
      { source: "/courses/real-estate-va", destination: "/programs/real-estate-va", permanent: true },
      { source: "/courses/us-bookkeeping-va", destination: "/programs/us-bookkeeping-va", permanent: true },
      { source: "/courses/:slug/preview/:lessonId", destination: "/programs/:slug/preview/:lessonId", permanent: true },
      { source: "/jobs", destination: "/career-placement", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://api.stripe.com https://api.paymongo.com https://api.openai.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
