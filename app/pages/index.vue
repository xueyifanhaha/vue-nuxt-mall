<script setup lang="ts">
import { NavBar, Icon, Swipe, SwipeItem, Grid, GridItem, Loading, Empty, showToast } from 'vant'
import type { HomeData, GoodsItem } from '#shared/types'

useSeoMeta({ title: '首页 - mall 商城' })

const { data, error, status } = await useAsyncData('home', () =>
  request<HomeData>('/api/home'),
)

// 收藏（本地态，收藏 store 之后再抽）
const favoriteIds = ref(new Set<number>())

function toggleFavorite(g: GoodsItem) {
  const s = favoriteIds.value
  if (s.has(g.id)) {
    s.delete(g.id)
  }
  else {
    s.add(g.id)
    showToast(`已收藏「${g.title}」`)
  }
  favoriteIds.value = new Set(s) // 触发响应式
}

// 加入购物车（购物车 store 在后续阶段实现，先做交互占位）
function addToCart(g: GoodsItem) {
  showToast(`已加入购物车：${g.title}`)
}

function toSearch() {
  navigateTo('/search')
}

function formatSales(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n)
}
</script>

<template>
  <div class="home">
    <NavBar title="拾光百货">
      <template #right>
        <Icon name="search" size="18" @click="toSearch" />
      </template>
    </NavBar>

    <!-- 加载中 / 出错 -->
    <div v-if="status === 'pending'" class="state-box">
      <Loading size="24" vertical>加载中...</Loading>
    </div>
    <Empty v-else-if="error" description="加载失败，请刷新重试" />

    <template v-else-if="data">
      <!-- 轮播 -->
      <Swipe class="banner" :autoplay="3000" indicator-color="#fff">
        <SwipeItem v-for="b in data.banners" :key="b.id">
          <img class="banner-img" :src="b.image" :alt="b.title" />
        </SwipeItem>
      </Swipe>

      <!-- 金刚区：icon 插槽放图 + text 属性渲染文字（默认插槽会吞掉 text） -->
      <Grid class="nav-grid" :column-num="6" :border="false">
        <GridItem v-for="n in data.navIcons" :key="n.id" :text="n.name">
          <template #icon>
            <img class="nav-icon" :src="n.image" :alt="n.name" />
          </template>
        </GridItem>
      </Grid>

      <!-- 推荐商品 -->
      <h2 class="section-title serif-title">推荐商品</h2>
      <Grid class="goods-grid" :column-num="2" :border="false" :gutter="8">
        <GridItem
          v-for="g in data.recommend"
          :key="g.id"
          class="goods-card"
          @click="navigateTo(`/product/${g.id}`)"
        >
          <div class="goods-media">
            <img class="goods-img" :src="g.image" :alt="g.title" loading="lazy" />
            <div class="goods-actions">
              <button
                class="action-btn"
                :class="{ active: favoriteIds.has(g.id) }"
                :aria-label="favoriteIds.has(g.id) ? '取消收藏' : '收藏'"
                @click.stop="toggleFavorite(g)"
              >
                <Icon :name="favoriteIds.has(g.id) ? 'like' : 'like-o'" />
              </button>
              <button class="action-btn" aria-label="加入购物车" @click.stop="addToCart(g)">
                <Icon name="shopping-cart-o" />
              </button>
            </div>
          </div>
          <div class="goods-info">
            <p class="goods-title">{{ g.title }}</p>
            <div class="goods-row">
              <span class="goods-price"><i>¥</i>{{ g.price }}</span>
              <span class="goods-sales">已售{{ formatSales(g.sales) }}</span>
            </div>
          </div>
        </GridItem>
      </Grid>
    </template>
  </div>
</template>

<style scoped lang="scss">
.state-box {
  display: flex;
  justify-content: center;
  padding: 120px 0;
}

/* 轮播：卡片化，与页面留出呼吸感 */
.banner {
  height: 150px;
  margin: 10px 10px 0;
  border-radius: 10px;
  overflow: hidden;

  :deep(.van-swipe__indicator--active) {
    background-color: var(--c-brass);
  }

  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* 金刚区：圆形图标 + 细描边 */
.nav-grid {
  margin-top: 12px;

  :deep(.van-grid-item__text) {
    margin-top: 6px;
    color: var(--c-ink);
    font-size: 11px;
    line-height: 1.2;
  }

  .nav-icon {
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--c-line);
  }
}

/* 衬线栏目标题 + 铜金菱形饰：全站记忆点 */
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 22px 0 10px;
  font-size: 16px;
  color: var(--c-ink);

  &::before,
  &::after {
    content: '';
    width: 5px;
    height: 5px;
    background: var(--c-brass);
    transform: rotate(45deg);
  }
}

.goods-grid {
  padding: 0 10px;

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
    box-shadow: 0 1px 4px rgba(15, 47, 40, 0.25);

    &.active {
      color: var(--c-cinnabar);
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
    color: var(--c-cinnabar);
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
}
</style>
