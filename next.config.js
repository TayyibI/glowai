/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Move it here for newer Next.js versions
  allowedDevOrigins: ["vogie-corresponsively-brantley.ngrok-free.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "://unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
