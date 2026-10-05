import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/pdf-page/**': [
      './node_modules/pdfjs-dist/legacy/build/**',
      './node_modules/@napi-rs/canvas/**',
      './public/pdfjs/**',
    ],
  },
};

export default nextConfig;
