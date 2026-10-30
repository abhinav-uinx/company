/**
 * NIST SP 800-53 (SC-8, SC-13, SC-28, SI-10) & OWASP Secure Headers Configuration
 */
const securityHeaders = [
  // Prevent MIME-type sniffing (NIST SI-10)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Anti-Clickjacking protection (NIST SC-8)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Enforce HTTPS transmission with 2-year HSTS & preload (NIST SC-8 / SC-13)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Restrict referrer data across cross-origin requests (NIST SC-28)
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable unused browser hardware APIs to minimize attack surface
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  // Block Flash & Silverlight cross-domain policy files
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  // DNS Prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Cross-Site Scripting (XSS) Filter legacy safeguard
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Robust Content Security Policy (NIST SI-10 / OWASP A03)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' blob: data: https:",
      "connect-src 'self' https: wss: http://ip-api.com https://ip-api.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress Next.js identification header (removes X-Powered-By)
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
