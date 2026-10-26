<script setup lang="ts">
import { Icon, showToast } from 'vant'
import type { GoodsItem } from '#shared/types'

// 商品卡：分类/搜索/首页共用（图片 + 收藏/加购悬浮钮 + 标题 + 价格行）
const props = defineProps<{ goods: GoodsItem }>()

// 收藏走全局 store：列表与详情页共享同一份状态，任一处切换另一处立刻同步
const favorites = useFavoritesStore()
const isFav = computed(() => favorites.has(props.goods.id))

function toggleFav() {
  const nowFav = favorites.toggle(props.goods.id)
  showToast(nowFav ? `已收藏「${props.goods.title}」` : '已取消收藏')
}

function formatSales(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n)
}
</script>

<template>
  <!-- 卡片本身不再是可点 div：跳转交给标题上的 <a>（NuxtLink），
       再用 ::after 把链接热区铺满整张卡，视觉上仍是「点卡片任意处进入详情」。
       这样做的好处：SSR 输出里有真实内链（爬虫可抓）、键盘 Tab 能聚焦、右键可新开标签；
       收藏按钮是 <a> 的兄弟节点（<a> 里不允许嵌交互元素），靠 z-index 盖在热区之上 -->
  <div class="goods-card">
    <div class="goods-media">
      <img
        class="goods-img"
        :src="goods.image"
        :alt="goods.title"
        loading="lazy"
      >
      <div class="goods-actions">
        <button
          class="action-btn"
          :class="{ active: isFav }"
          :aria-label="isFav ? '取消收藏' : '收藏'"
          @click.stop="toggleFav"
        >
          <Icon :name="isFav ? 'like' : 'like-o'" />
        </button>
      </div>
    </div>
    <div class="goods-info">
      <p class="goods-title">
        <NuxtLink
          class="card-link"
          :to="`/product/${goods.id}`"
        >
          {{ goods.title }}
        </NuxtLink>
      </p>
      <div class="goods-row">
        <span class="goods-price"><i>¥</i>{{ goods.price }}</span>
        <span class="goods-sales">已售{{ formatSales(goods.sales) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.goods-card {
  position: relative;
  border: 1px solid var(--c-line);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;

  // 键盘聚焦时给整卡描边（链接本身是透明文字，焦点环画在卡上更清楚）
  &:has(.card-link:focus-visible) {
    outline: 2px solid var(--c-primary);
    outline-offset: -2px;
  }
}

// 链接只承载「语义 + 跳转」，视觉仍是标题本身；::after 把热区铺满整卡
.card-link {
  color: inherit;
  text-decoration: none;
  outline: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
  }
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
  // 盖在链接热区（z-index:1）之上，否则点收藏会先触发跳转
  z-index: 2;
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
