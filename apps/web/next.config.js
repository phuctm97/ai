/** @type {import('next').NextConfig} */
const config = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  ...(process.env.NEXT_PUBLIC_FOR_MOBILE
    ? {
        output: "export",
        distDir: "out-for-mobile",
        cleanDistDir: true,
      }
    : {}),
};

module.exports = config;
