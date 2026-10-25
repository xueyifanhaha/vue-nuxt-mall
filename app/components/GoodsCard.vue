<script setup lang="ts">
import { Icon, showToast } from 'vant'
import type { GoodsItem } from '#shared/types'

// 商品卡：分类/搜索/首页共用（图片 + 收藏/加购悬浮钮 + 标题 + 价格行）
const props = defineProps<{ goods: GoodsItem }>()

// 收藏是本地态，后续阶段抽成 Pinia favorites store
const isFav = ref(false)

function toggleFav() {
  isFav.value = !isFav.value
  if (isFav.value) {
    showToast(`已收藏「${props.goods.title}」`)
  }
}

function addToCart() {
  showToast(`已加入购物车：${props.goods.title}`)
}

function formatSales(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n)
}
</script>

<template>
  <div class="goods-card" @click="navigateTo(`/product/${goods.id}`)">
    <div class="goods-media">
      <img class="goods-img" :src="goods.image" :alt="goods.title" loading="lazy" />
      <div class="goods-actions">
        <button
          class="action-btn"
          :class="{ active: isFav }"
          :aria-label="isFav ? '取消收藏' : '收藏'"
          @click.stop="toggleFav"
        >
          <Icon :name="isFav ? 'like' : 'like-o'" />
        </button>
        <button class="action-btn" aria-label="加入购物车" @click.stop="addToCart">
          <Icon name="shopping-cart-o" />
        </button>
      </div>
    </div>
    <div class="goods-info">
      <p class="goods-title">{{ goods.title }}</p>
      <div class="goods-row">
        <span class="goods-price"><i>¥</i>{{ goods.price }}</span>
        <span class="goods-sales">已售{{ formatSales(goods.sales) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.goods-card {
  border: 1px solid var(--c-line);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
}

.goods-media {
  position: relative;
}

.goods-img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.goods-actions {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--c-ink);
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-float);

  &.active {
    color: var(--c-price);
  }
}

.goods-info {
  padding: 8px 10px 10px;
}

.goods-title {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--c-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 38px;
}

.goods-row {
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
}

.goods-price {
  font-weight: bold;
  color: var(--c-price);
  font-size: 16px;
  white-space: nowrap;

  i {
    font-style: normal;
    font-size: 12px;
    margin-right: 1px;
  }
}

.goods-sales {
  margin-left: auto;
  font-size: 11px;
  color: var(--c-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
