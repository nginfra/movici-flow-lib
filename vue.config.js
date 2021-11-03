module.exports = {
  lintOnSave: 'warning',
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true
    }
  },
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "./src/assets/sass/variables.scss";`
      }
    }
  },
  configureWebpack: config => {
    config.resolve.alias['@movici-flow-common'] = path.join(__dirname, 'movici-flow-common/src/');
  }
};
