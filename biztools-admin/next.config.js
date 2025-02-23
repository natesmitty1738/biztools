/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Enable WebAssembly for LLaMA
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle large files (for model weights)
    config.performance = {
      ...config.performance,
      maxAssetSize: 1024 * 1024 * 100, // 100MB
      maxEntrypointSize: 1024 * 1024 * 100, // 100MB
    };

    return config;
  },
  // Increase API response timeout for model inference
  api: {
    responseLimit: '100mb',
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

module.exports = nextConfig; 