// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // 未使用变量 → error：本项目栽过 3 次「漏导入 / 删了 import 还在用」
    'no-unused-vars': 'off', // 关掉基础版，交给 TS 版本（否则类型位置误报）
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'none',
    }],
    // 调试残留挡在提交前（console.log 留 warn，不阻塞）
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'vue/multi-word-component-names': 'off', // pages/index.vue 这类 Nuxt 约定名
  },
})
