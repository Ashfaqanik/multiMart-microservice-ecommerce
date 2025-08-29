// @ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withNx } = require("@nx/next");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: false,
  },
  distDir: ".next",
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withNx(nextConfig);
