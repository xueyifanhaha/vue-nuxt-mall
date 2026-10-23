// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  css: ['vant/lib/index.css'],

  postcss: {
    plugins: {
      'postcss-px-to-viewport': {
        viewportWidth: 375,
        unitPrecision: 5,
        minPixelValue: 1,
        exclude: [/node_modules\/vant/]
      }
    }
  }
})
