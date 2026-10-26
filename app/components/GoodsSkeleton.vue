<script setup lang="ts">
// 商品卡骨架：仅用于「列表已挂载、数据未回」的加载态（切分类 / 新搜索 / 首页 refresh）
// 尺寸严格对齐 GoodsCard（1:1 图区 + 两行标题 38px + 价格行 22px），避免数据到达时布局跳动（CLS）
withDefaults(defineProps<{ count?: number }>(), { count: 6 })
</script>

<template>
  <div class="goods-skeleton" aria-hidden="true">
    <div v-for="i in count" :key="i" class="sk-card">
      <div class="sk-media" />
      <div class="sk-info">
        <div class="sk-title">
          <span class="sk-line" />
          <span class="sk-line short" />
        </div>
        <div class="sk-row">
          <span class="sk-line price" />
          <span class="sk-line sales" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.goods-skeleton {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 10px;
}

.sk-card {
  border: 1px solid var(--c-line);
  border-radius: 8px;
  overflow: hidden;
  background: var(--c-card);
}

/* 所有占位块共用同一套流光动画，视觉节奏统一 */
.sk-media,
.sk-line {
  background-image: linear-gradient(
    90deg,
    #f3eae0 25%,
    #fbf5ee 37%,
    #f3eae0 63%
  );
  background-size: 400% 100%;
  animation: sk-shimmer 1.3s ease-in-out infinite;
}

.sk-media {
  width: 100%;
  aspect-ratio: 1;
}

.sk-info {
  padding: 8px 10px 10px; /* 与 GoodsCard 的 .goods-info 一致 */
}

.sk-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 38px; /* GoodsCard 标题两行 + line-clamp 的占位高度 */
}

.sk-line {
  display: block;
  height: 13px;
  border-radius: 4px;

  &.short {
    width: 62%;
  }
}

.sk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  height: 22px; /* 与价格行（16px 字 + line-height）等高 */
  margin-top: 8px;

  .price {
    width: 46%;
    height: 15px;
  }

  .sales {
    width: 26%;
    height: 11px;
  }
}

@keyframes sk-shimmer {
  from {
    background-position: 100% 50%;
  }

  to {
    background-position: 0 50%;
  }
}

/* 尊重系统的减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .sk-media,
  .sk-line {
    animation: none;
  }
}
</style>
