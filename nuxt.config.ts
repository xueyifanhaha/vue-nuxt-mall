// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  // 2026-10-25 尝试过 Vant 按需样式（unplugin-vue-components + VantResolver），
  // 因 Vite 8 下 dev SSR 管线组件解析失效 + noExternal 致 worker OOM 而回滚，详见当日记忆
  css: ['vant/lib/index.css', '~/assets/styles/main.scss'],

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
