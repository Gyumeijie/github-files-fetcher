const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteToFilePlugin = require('write-to-file-webpack');
const config = require('./package.json');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  target: 'node',
  externals: [
    'electron',
  ],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'CHANGELOG.md', to: path.resolve(__dirname, 'dist', 'CHANGELOG.md') },
        { from: 'README.md', to: path.resolve(__dirname, 'dist', 'README.md') },
      ]
    }),
    new WriteToFilePlugin({
      filename: path.resolve(__dirname, 'dist/package.json'),
      data() {
        // We publish the bundled file, so we don't need the following option in pacakage.json
        return JSON.stringify({
          ...config,
          dependencies: undefined,
          devDependencies: undefined,
          scripts: undefined,
          config: undefined,
        });
      },
    }),
  ],
};
