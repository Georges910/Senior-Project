const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance optimizations
config.transformer = {
  ...config.transformer,
  // Inline requires for faster startup (lazy-load modules)
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true, // Key optimization: only require modules when needed
    },
  }),
  // Minify in production
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    compress: {
      drop_console: process.env.NODE_ENV === 'production', // Remove console.log in production
    },
  },
};

module.exports = config;
