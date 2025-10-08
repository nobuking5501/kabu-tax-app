const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@kabu-tax/database'] = path.resolve(__dirname, '../../packages/database/src');
    return config;
  },
};

module.exports = nextConfig;
