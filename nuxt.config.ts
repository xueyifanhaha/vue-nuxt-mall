// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  devtools: { enabled: true },

  // 2026-10-25 尝试过 Vant 按需样式（unplugin-vue-components + VantResolver），
  // 因 Vite 8 下 dev SSR 管线组件解析失效 + noExternal 致 worker OOM 而回滚，详见当日记忆
  css: ['vant/lib/index.css', '~/assets/styles/main.scss'],
  compatibilityDate: '2026-10-01',

  postcss: {
    plugins: {
      'postcss-px-to-viewport': {
        viewportWidth: 375,
        unitPrecision: 5,
        minPixelValue: 1,
        exclude: [/node_modules\/vant/],
      },
    },
  },

  // ESLint：由 @nuxt/eslint 生成 flat config（.nuxt/eslint.config.mjs），
  // eslint.config.mjs 里 withNuxt() 直接引用；stylistic 负责格式统一（不额外引 Prettier）
  eslint: {
    config: {
      stylistic: true,
    },
  },
})
