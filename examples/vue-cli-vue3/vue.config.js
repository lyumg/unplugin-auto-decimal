const { defineConfig } = require('@vue/cli-service')
const AutoDecimal = require('unplugin-auto-decimal/webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    devtool: 'source-map',
    plugins: [
      AutoDecimal(),
    ],
  },
})
