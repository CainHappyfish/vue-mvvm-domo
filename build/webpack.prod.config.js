// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef,@typescript-eslint/naming-convention
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const baseConfig = require('./webpack.base.config')

// eslint-disable-next-line no-undef
module.exports = merge(baseConfig, {
  mode: 'production',
  plugins: [new CleanWebpackPlugin()]
})
