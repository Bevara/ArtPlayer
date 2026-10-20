/* Builds art-player_1.js with the player's toolchain: the tag bundles the
 * universal canvas (../../../../UCanvas.ts), the ArtPlayer core
 * (../artplayer/dist) and the media facade (../universal-canvas/src/media.js)
 * into one script, which bevara update-page copies alone next to a page. */
const path = require('node:path')
// The player's node_modules, this repository being its webinterface/ArtPlayer.
const player = path.resolve(__dirname, '../../../..')
let TerserPlugin = null
try {
  TerserPlugin = require(require.resolve('terser-webpack-plugin', { paths: [player] }))
}
catch { /* minified with webpack's defaults */ }

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    filename: 'art-player_1.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: require.resolve('ts-loader', { paths: [player] }),
        options: { configFile: path.join(player, 'tsconfig.json'), onlyCompileBundledFiles: true },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules', path.join(player, 'node_modules')],
    fallback: {
      'fs': false,
      'path': false,
      'os': false,
      'zlib': false,
      'stream': false,
      'crypto': false,
      'http': false,
      'https': false,
      'net': false,
      'tls': false,
      'utf-8-validate': false,
      'bufferutil': false,
    },
  },
  resolveLoader: {
    modules: [path.join(player, 'node_modules')],
  },
  // Keep the licence notices of the bundled code (ArtPlayer, JSZip…) inside
  // the script, which travels without a .LICENSE.txt.
  optimization: TerserPlugin ? { minimizer: [new TerserPlugin({ extractComments: false })] } : {},
  performance: { hints: false },
}
