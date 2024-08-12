// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef,@typescript-eslint/naming-convention
const HtmlWebpackPlugin = require('html-webpack-plugin')

// eslint-disable-next-line no-undef
module.exports = {
  // 指定入口文件
  entry: './env-test/index.ts',

  // 指定打包文件所在目录
  output: {
    // eslint-disable-next-line no-undef
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    environment: {
      arrowFunction: false // 关闭webpack的箭头函数，可选
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  // 用来设置引用模块
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  // 配置插件
  plugins: [
    new HtmlWebpackPlugin({
      title: "C4iN's MVVM Test",
      template: './env-test/index.html'
    })
  ]
}
