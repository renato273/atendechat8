const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Agregar fallbacks para módulos de Node.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        util: require.resolve('util'),
        path: require.resolve('path-browserify'),
        fs: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
      };

      // Agregar plugins necesarios
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: require.resolve('process/browser'),
        })
      );

      return webpackConfig;
    },
  },
};
