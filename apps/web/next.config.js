const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const config = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { isServer, nextRuntime }) => {
    // Avoid AWS SDK Node.js require issue https://github.com/aws-amplify/amplify-js/issues/11030
    if (isServer && nextRuntime === "nodejs")
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^aws-crt$/ })
      );
    return config;
  },
  ...(process.env.NEXT_PUBLIC_FOR_MOBILE
    ? {
        output: "export",
        distDir: "out-for-mobile",
        cleanDistDir: true,
      }
    : {}),
};

module.exports = config;
