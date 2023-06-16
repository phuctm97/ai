/** @type {import('next').NextConfig} */
const config = {
  eslint: { ignoreDuringBuilds: true },
  ...(process.env.NEXT_TARGET === "mobile"
    ? {
        output: "export",
        distDir: "out-for-mobile",
        cleanDistDir: true,
      }
    : {}),
};

module.exports = config;
