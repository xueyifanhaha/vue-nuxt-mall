<script setup lang="ts">
import { Button, Empty } from 'vant'
import type { NuxtError } from '#app'

// 错误页是独立于 app.vue 的根级渲染：没有 layouts/Tabbar，结构要自己写全
const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: () => (is404.value ? '页面不存在 - 拾光百货' : '出错了 - 拾光百货') })

function goHome() {
  // clearError 清掉错误态并跳转；错误页里的 navigateTo 不会退出错误态，必须用它
  clearError({ redirect: '/' })
}

function retry() {
  clearError({ redirect: useRoute().fullPath })
}
</script>

<template>
  <div class="error-page">
    <Empty
      :image="is404 ? 'search' : 'error'"
      :description="is404 ? '你要找的页面不存在或已被移除' : '服务器出了点问题，请稍后重试'"
    >
      <div class="err-actions">
        <Button round type="primary" class="btn" @click="goHome">回首页</Button>
        <Button v-if="!is404" round plain type="primary" class="btn" @click="retry">重试</Button>
      </div>
      <p class="code">{{ error.statusCode }}</p>
    </Empty>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: var(--c-bg);

  .err-actions {
    display: flex;
    gap: 12px;
  }

  .btn {
    padding: 0 28px;
  }

  .code {
    margin: 16px 0 0;
    font-size: 12px;
    color: var(--c-muted);
    letter-spacing: 2px;
  }
}
</style>
