// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const { merge } = require('webpack-merge')
// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const baseConfig = require('./webpack.base.config')

// eslint-disable-next-line no-undef
module.exports = merge(baseConfig, {
  // 开发模式使用，方便查错误
  mode: 'development',
  devtool: 'inline-source-map',
  // 配置服务器
  devServer: {
    static: './dist'
  }
})
