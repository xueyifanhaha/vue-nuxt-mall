<template>
  <div>
    <!-- 客户端路由切换的顶部进度条：SSR 首屏本身有内容，需要反馈的是跳转过程 -->
    <NuxtLoadingIndicator color="#ff7a2e" :height="3" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
