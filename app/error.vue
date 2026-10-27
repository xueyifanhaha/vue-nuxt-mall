<script setup lang="ts">
import { Button } from 'vant'
import type { NuxtError } from '#app'

// 错误页是独立于 app.vue 的根级渲染：没有 layouts/Tabbar，结构要自己写全。
// 插图不用 Vant Empty：它的插图 SVG 靠模块级计数器动态生成渐变 id（van-empty-6-11），
// SSR 与水合的计数对不上会产生成片 hydration attribute mismatch 警告——
// 这里换成自绘静态 SVG，id 写死，两端渲染必然一致。
const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

const title = computed(() => (is404.value ? '页面走丢了' : '服务器开小差了'))
const desc = computed(() =>
  is404.value ? '你要找的页面不存在或已被移除，去别处逛逛吧' : '服务器出了点问题，请稍后重试',
)

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
    <div class="error-card">
      <!-- 自绘插图：购物袋 + 问号，渐变 id 固定，SSR/客户端输出逐字节一致 -->
      <svg
        class="illust"
        viewBox="0 0 160 120"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="err-halo"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0"
              stop-color="#ffe9d4"
            />
            <stop
              offset="1"
              stop-color="#ffc79c"
            />
          </linearGradient>
          <linearGradient
            id="err-bag"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              stop-color="#ff9a4d"
            />
            <stop
              offset="1"
              stop-color="#ff7a2e"
            />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="62"
          r="50"
          fill="url(#err-halo)"
        />
        <circle
          cx="128"
          cy="24"
          r="9"
          fill="#ffb02e"
          opacity="0.35"
        />
        <circle
          cx="28"
          cy="98"
          r="6"
          fill="#ff7a2e"
          opacity="0.25"
        />
        <circle
          cx="136"
          cy="84"
          r="4"
          fill="#ff7a2e"
          opacity="0.2"
        />
        <path
          d="M52 48h56l6 50a6 6 0 0 1-6 7H52a6 6 0 0 1-6-7z"
          fill="url(#err-bag)"
        />
        <path
          d="M66 48v-9a14 14 0 0 1 28 0v9"
          fill="none"
          stroke="#d95f12"
          stroke-width="5"
          stroke-linecap="round"
        />
        <text
          x="80"
          y="90"
          text-anchor="middle"
          font-size="32"
          font-weight="bold"
          fill="#ffffff"
          font-family="Arial, sans-serif"
        >?</text>
      </svg>

      <p class="code">
        {{ error.statusCode }}
      </p>
      <h1 class="title">
        {{ title }}
      </h1>
      <p class="desc">
        {{ desc }}
      </p>
      <div class="actions">
        <Button
          round
          type="primary"
          class="btn"
          @click="goHome"
        >
          回首页
        </Button>
        <Button
          v-if="!is404"
          round
          plain
          type="primary"
          class="btn"
          @click="retry"
        >
          重试
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 24px;
  background: var(--c-bg);
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  padding: 32px 24px 28px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(255, 122, 46, 0.1);

  .illust {
    width: 160px;
    height: 120px;
  }

  .code {
    margin: 16px 0 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--c-primary);
    letter-spacing: 3px;
  }

  .title {
    margin: 6px 0 0;
    font-size: 20px;
    color: var(--c-ink);
  }

  .desc {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--c-muted);
    text-align: center;
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .btn {
    min-width: 108px;
    padding: 0 28px;
  }
}
</style>
