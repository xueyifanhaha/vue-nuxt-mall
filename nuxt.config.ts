// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  devtools: { enabled: true },

  // Vant 样式按需：清单在 app/assets/styles/vant.css（28 个文件、92KB，全量是 195KB）。
  // 聚成单文件还顺带修掉 dev 的重复注入——在 css 数组里直接写 node_modules 路径时，
  // 同一文件会被注入成 /@fs/D:/... 和 /D:/... 两个 URL，浏览器下载两遍
  css: ['~/assets/styles/vant.css', '~/assets/styles/main.scss'],
  compatibilityDate: '2026-10-01',

  postcss: {
    plugins: {
      'postcss-px-to-viewport': {
        viewportWidth: 375,
        unitPrecision: 5,
        minPixelValue: 1,
        // 第二个正则不是多余的：vant.css 里的 @import 会被内联，内联后 postcss 看到的
        // 文件路径是聚合文件本身（不在 node_modules 下），只写第一条会让 Vant 的 px 也被转成 vw
        exclude: [/node_modules[\\/]vant/, /assets[\\/]styles[\\/]vant\.css/],
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
